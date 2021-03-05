package lib.enonic.libStatic.etag;

import java.util.Map;
import java.util.function.Supplier;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.testing.ScriptTestSupport;

import static org.junit.Assert.*;

public class EtagServiceTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( EtagServiceTest.class );

    private EtagService service;

    private final Supplier<ResourceService> resourceServiceSupplierMock =
        () -> new ClassLoaderResourceService( EtagService.class.getClassLoader() );


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
        service = new EtagService();
        service.initialize( newBeanContext(ResourceKey.from("myapplication:/test")));

        service.resourceServiceSupplier = resourceServiceSupplierMock;
    }

    @Test
    public void testGetEtag_defaultETag_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertNull( getError( result ) );
        assertTrue(getETag(result).trim().length() > 0); //, "The returned ETag should not be empty");
    }

    @Test
    public void testGetEtag_defaultETag_dev_noEtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertNull( getError( result ) );
        assertNull( getETag( result ) );
    }


    @Test
    public void testGetEtag_positiveETagOverride_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertNull( getError( result ) );
        assertTrue(getETag(result).length() > 0); // "Positive etagOverride, so the ETag should be returned");
    }

    @Test
    public void testGetEtag_positiveETagOverride_dev_EtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertNull( getError( result ) );
        assertTrue(getETag(result).length() > 0);//, "Positive etagOverride, so EVEN IN DEV the ETag should be returned");
    }


    @Test
    public void testGetEtag_negativeETagOverride_prod_noEtagOrErrorExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertNull( getError( result ) );
        assertNull( getETag( result ) ); //, "Negative etagOverride, so EVEN IN PROD the ETag should be skipped");
    }

    @Test
    public void testGetEtag_negativeETagOverride_dev_noEtagOrErrorExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertNull( getError( result ) );
        assertNull( getETag( result ) ); //, "Negative etagOverride, so no ETag");
    }


    ////////////////////////////////////////////  Error handling

    // 500
    @Test
    public void testGetEtag_exceptions_shouldReturnMessageUnderErrorKey() {
        service.resourceServiceSupplier = () -> Mockito.mock( ResourceService.class, invocation -> {
            throw new RuntimeException( "Catch-and-return" );
        } );

        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);

        assertNotNull( getError( result ) );
        assertNull( getETag( result ) );
    }

}
