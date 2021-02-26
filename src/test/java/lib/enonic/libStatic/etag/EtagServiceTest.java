package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;

import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class EtagServiceTest extends ScriptTestSupport {
    // private final static Logger LOG = LoggerFactory.getLogger( EtagServiceTest.class );

    private EtagService service;

    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        service = new EtagService();
        service.initialize( newBeanContext(ResourceKey.from("myapplication:/test")));
    }

    @Test
    public void testGetEtag_status() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
    }

    @Test
    public void testGetEtag_defaultETag_prod() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(EtagService.ETAG_KEY).trim().length() > 0); //, "The returned ETag should not be empty");
    }

    @Test
    public void testGetEtag_defaultETag_dev_noEtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(EtagService.ETAG_KEY));
    }


    @Test
    public void testGetEtag_positiveETagOverride_prod() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(EtagService.ETAG_KEY).trim().length() > 0); // "Positive etagOverride, so the ETag should be returned");
    }

    @Test
    public void testGetEtag_positiveETagOverride_dev_EtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(EtagService.ETAG_KEY).trim().length() > 0);//, "Positive etagOverride, so EVEN IN DEV the ETag should be returned");
    }


    @Test
    public void testGetEtag_negativeETagOverride_prod_noEtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(EtagService.ETAG_KEY)); //, "Negative etagOverride, so EVEN IN PROD the ETag should be skipped");
    }

    @Test
    public void testGetEtag_negativeETagOverride_dev() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(200, Integer.parseInt(result.get(EtagService.STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(EtagService.ETAG_KEY)); //, "Negative etagOverride, so no ETag");
    }

    @Test
    public void testGetEtag_testGetEtag_defaultETag_prod_shouldReadFirstCacheSubsequent() {
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

        // LOG.info("etag: " + result1.get(EtagService.ETAG_KEY));

        // All results should have an etag (so 3 long) and status 200
        assertTrue(result1.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result2.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result3.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result4.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result5.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result6.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertEquals(200, Integer.parseInt(result1.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result2.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result3.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result4.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result5.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result6.get(EtagService.STATUS_KEY)));

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }

    @Test
    public void testGetEtag_testGetEtag_positiveETag_dev_shouldReadFirstCacheSubsequent() {
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

        // LOG.info("etag: " + result1.get(EtagService.ETAG_KEY));

        // All results should have an etag (so 3 long) and status 200
        assertTrue(result1.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result2.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result3.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result4.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result5.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertTrue(result6.get(EtagService.ETAG_KEY).trim().length() > 0);
        assertEquals(200, Integer.parseInt(result1.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result2.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result3.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result4.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result5.get(EtagService.STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result6.get(EtagService.STATUS_KEY)));

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }
}
