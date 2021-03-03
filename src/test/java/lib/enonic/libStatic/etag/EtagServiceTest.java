package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

import static lib.enonic.libStatic.etag.EtagService.ERROR_KEY;
import static lib.enonic.libStatic.etag.EtagService.ETAG_KEY;
import static lib.enonic.libStatic.etag.EtagService.STATUS_KEY;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class EtagServiceTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( EtagServiceTest.class );

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
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(ERROR_KEY));

    }

    @Test
    public void testGetEtag_defaultETag_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(ETAG_KEY).trim().length() > 0); //, "The returned ETag should not be empty");
        assertEquals(null, result.get(ERROR_KEY));
    }

    @Test
    public void testGetEtag_defaultETag_dev_onlyStatusExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(ETAG_KEY));
        assertEquals(null, result.get(ERROR_KEY));
    }


    @Test
    public void testGetEtag_positiveETagOverride_prod_EtagExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(ETAG_KEY).trim().length() > 0); // "Positive etagOverride, so the ETag should be returned");
        assertEquals(null, result.get(ERROR_KEY));
    }

    @Test
    public void testGetEtag_positiveETagOverride_dev_EtagExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertTrue(result.get(ETAG_KEY).trim().length() > 0);//, "Positive etagOverride, so EVEN IN DEV the ETag should be returned");
        assertEquals(null, result.get(ERROR_KEY));
    }


    @Test
    public void testGetEtag_negativeETagOverride_prod_onlyStatusExpected() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(ETAG_KEY)); //, "Negative etagOverride, so EVEN IN PROD the ETag should be skipped");
        assertEquals(null, result.get(ERROR_KEY));
    }

    @Test
    public void testGetEtag_negativeETagOverride_onlyStatusExpected() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertEquals(200, Integer.parseInt(result.get(STATUS_KEY))); // , "Status should be 200");
        assertEquals(null, result.get(ETAG_KEY)); //, "Negative etagOverride, so no ETag");
        assertEquals(null, result.get(ERROR_KEY));
    }

    @Test
    public void testGetEtag_defaultETag_prod_shouldReadFirstCacheSubsequent() {
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

        // LOG.info("etag: " + result1.get(ETAG_KEY));

        // All results should have an etag (so 3 long) and status 200
        assertTrue(result1.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result2.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result3.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result4.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result5.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result6.get(ETAG_KEY).trim().length() > 0);
        assertEquals(200, Integer.parseInt(result1.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result2.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result3.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result4.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result5.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result6.get(STATUS_KEY)));

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }

    @Test
    public void testGetEtag_positiveETag_dev_shouldReadFirstCacheSubsequent() {
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

        // LOG.info("etag: " + result1.get(ETAG_KEY));

        // All results should have an etag and status 200
        assertTrue(result1.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result2.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result3.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result4.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result5.get(ETAG_KEY).trim().length() > 0);
        assertTrue(result6.get(ETAG_KEY).trim().length() > 0);
        assertEquals(200, Integer.parseInt(result1.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result2.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result3.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result4.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result5.get(STATUS_KEY)));
        assertEquals(200, Integer.parseInt(result6.get(STATUS_KEY)));

        Long delta1 = t1-t0;
        float avgDelta6 = (t6-t1)/5f;

        // LOG.info("delta1: " + delta1);
        // LOG.info("avgDelta6: " + avgDelta6);

        // Expecting the subsequent calls to be on average much much faster
        assertTrue(delta1 / avgDelta6 > 100);
    }





    ////////////////////////////////////////////  Error handling

    // 400 - empty/root path
    @Test
    public void testGetEtag_prod_emptyPath_should400() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:", 0);
        assertEquals(400, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_emptyPath_should400() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:", 0);
        assertEquals(400, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_prod_rootPath_should400() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:/", 0);
        assertEquals(400, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_rootPath_should400() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:/", 0);
        assertEquals(400, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }


    // 404
    @Test
    public void testGetEtag_prod_noExist_should404() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", 0);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_noExist_should404() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", 0);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_prod_positiveEtagOverride_noExist_should404() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", 1);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_positiveEtagOverride_noExist_should404() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", 1);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_prod_negativeEtagOverride_noExist_should404() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", -1);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_negativeEtagOverride_noExist_should404() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/no.exist", -1);
        assertEquals(404, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }


    // 500
    @Test
    public void testGetEtag_prod_missingAppPath_should500() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("static/no.exist", 1);
        assertEquals(500, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }
    @Test
    public void testGetEtag_dev_missingAppPath_should500() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("static/no.exist", 1);
        assertEquals(500, Integer.parseInt(result.get(STATUS_KEY)));
        assertTrue(result.get(ERROR_KEY).trim().length() > 0);
        LOG.info("Ok: " + result.get(STATUS_KEY)  + " - " + result.get(ERROR_KEY));
    }

}
