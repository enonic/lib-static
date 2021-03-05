package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.function.Supplier;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class EtagServiceTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( EtagServiceTest.class );

    private EtagService service;


    private Supplier<ResourceService> resourceServiceSupplierMock;
    private ResourceService resourceServiceMock;

    private String getETag(Map<String, String> result) {
        return result.get(lib.enonic.libStatic.etag.EtagService.ETAG_KEY);
    }
    private String getError(Map<String, String> result) {
        return result.get(lib.enonic.libStatic.etag.EtagService.ERROR_KEY);
    }

    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        resourceServiceSupplierMock = Mockito.mock(Supplier.class);
        resourceServiceMock = Mockito.mock(ResourceService.class);

        Mockito.when(resourceServiceSupplierMock.get()).thenReturn(resourceServiceMock);
        //Mockito.when(resourceServiceMock.getResource( Mockito.any(ResourceKey.class) )).then

        service = new EtagService();
        service.initialize( newBeanContext(ResourceKey.from("myapplication:/test")));

        service.resourceServiceSupplier = resourceServiceSupplierMock;
    }

    @Test
    public void testGetEtag_defaultETag_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(null, getError(result));
        assertTrue(getETag(result).trim().length() > 0); //, "The returned ETag should not be empty");
    }

    @Test
    public void testGetEtag_defaultETag_dev_noEtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(null, getError(result));
        assertEquals(null, getETag(result));
    }


    @Test
    public void testGetEtag_positiveETagOverride_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(null, getError(result));
        assertTrue(getETag(result).length() > 0); // "Positive etagOverride, so the ETag should be returned");
    }

    @Test
    public void testGetEtag_positiveETagOverride_dev_EtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(null, getError(result));
        assertTrue(getETag(result).length() > 0);//, "Positive etagOverride, so EVEN IN DEV the ETag should be returned");
    }


    @Test
    public void testGetEtag_negativeETagOverride_prod_noEtagOrErrorExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(null, getError(result));
        assertEquals(null, getETag(result)); //, "Negative etagOverride, so EVEN IN PROD the ETag should be skipped");
    }

    @Test
    public void testGetEtag_negativeETagOverride_dev_noEtagOrErrorExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(null, getError(result));
        assertEquals(null, getETag(result)); //, "Negative etagOverride, so no ETag");
    }

    @Test
    public void testGetEtag_defaultETag_prod_shouldSaveTimeBecauseReadFirstCacheSubsequent() {
        service.isDev = false;
        Long t0 = System.nanoTime();
        Map<String, String> result1 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Long t1 = System.nanoTime();
        Map<String, String> result2 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Map<String, String> result3 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Map<String, String> result4 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Map<String, String> result5 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Map<String, String> result6 = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        Long t6 = System.nanoTime();

        // LOG.info("etag: " + getETag(result1));

        // All results should have an etag and no error
        assertEquals(null, getError(result1));
        assertEquals(null, getError(result2));
        assertEquals(null, getError(result3));
        assertEquals(null, getError(result4));
        assertEquals(null, getError(result5));
        assertEquals(null, getError(result6));
        assertTrue(getETag(result1).length() > 0);
        assertTrue(getETag(result2).length() > 0);
        assertTrue(getETag(result3).length() > 0);
        assertTrue(getETag(result4).length() > 0);
        assertTrue(getETag(result5).length() > 0);
        assertTrue(getETag(result6).length() > 0);

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }

    @Test
    public void testGetEtag_positiveETag_dev_shouldSaveTimeBecauseReadFirstCacheSubsequent() {
        service.isDev = true;
        Long t0 = System.nanoTime();
        Map<String, String> result1 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Long t1 = System.nanoTime();
        Map<String, String> result2 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Map<String, String> result3 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Map<String, String> result4 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Map<String, String> result5 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Map<String, String> result6 = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        Long t6 = System.nanoTime();

        // LOG.info("etag: " + getETag(result1));

        // All results should have an etag and no error
        assertEquals(null, getError(result1));
        assertEquals(null, getError(result2));
        assertEquals(null, getError(result3));
        assertEquals(null, getError(result4));
        assertEquals(null, getError(result5));
        assertEquals(null, getError(result6));
        assertTrue(getETag(result1).length() > 0);
        assertTrue(getETag(result2).length() > 0);
        assertTrue(getETag(result3).length() > 0);
        assertTrue(getETag(result4).length() > 0);
        assertTrue(getETag(result5).length() > 0);
        assertTrue(getETag(result6).length() > 0);

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }





    ////////////////////////////////////////////  Error handling

    // 500
    @Test
    public void testGetEtag_exceptions_shouldReturnMessageUnderErrorKey() {
        Mockito.when(resourceServiceMock.getResource( Mockito.any(ResourceKey.class) )).thenThrow(new RuntimeException("Catch-and-return"));

        service.resourceServiceSupplier = resourceServiceSupplierMock;

        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);

        assertEquals("Catch-and-return", getError(result));
        assertEquals(null, getETag(result));
    }

}
