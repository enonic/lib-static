package lib.enonic.libStatic;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ETaggingResourceReaderTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( ETaggingResourceReaderTest.class );

    private ETaggingResourceReader reader;

    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        this.reader = new ETaggingResourceReader();
        this.reader.initialize( newBeanContext(ResourceKey.from("myapplication:/test")));
    }

    @Test
    public void testRead_body() {
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        assertTrue(result.size() > 1); // , "Valid resource request, so there should be at least 2 items returned: status and body");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
        assertEquals(result.get(1), "I am a test text\n"); // , "File body should be returned");
    }

    @Test
    public void testRead_defaultETag_prod() {
        reader.isDev = false;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        assertTrue(result.size() > 2); //, "Default etagOverride, so in prod there should be at least 3 items returned - the third listed return should be the ETag.");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
        assertTrue(result.get(2).trim().length() > 0); //, "The third returned string (ETag) should not be empty");
    }

    @Test
    public void testRead_defaultETag_dev_noEtagExpected() {
        reader.isDev = true;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        assertTrue(result.size() == 2); //, "Default etagOverride, so in dev there should be at only 2 items returned - the third listed return, ETag, should be skipped");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
    }


    @Test
    public void testRead_positiveETagOverride_prod() {
        reader.isDev = false;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 1);
        assertTrue(result.size() > 2); //, "Positive etagOverride, so there should be at least 3 items returned - the third listed return should be the ETag.");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
        assertTrue(result.get(2).trim().length() > 0); //, "The third returned string (ETag) should not be empty");
    }

    @Test
    public void testRead_positiveETagOverride_dev_EtagExpected() {
        reader.isDev = true;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 1);
        assertTrue(result.size() > 2); //, "Positive etagOverride, so EVEN IN DEV there should be at least 3 items returned - the third listed return should be the ETag.");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
        assertTrue(result.get(2).trim().length() > 0); //, "The third returned string (ETag) should not be empty");
    }


    @Test
    public void testRead_negativeETagOverride_prod_noEtagExpected() {
        reader.isDev = false;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", -1);
        assertTrue(result.size() == 2); //, "Negative etagOverride, so EVEN IN PROD there should be only 2 items returned - the third listed return, ETag, should be skipped");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
    }

    @Test
    public void testRead_negativeETagOverride_dev() {
        reader.isDev = true;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", -1);
        assertTrue(result.size() == 2); //, "Default etagOverride, so there should be only 2 items returned - the third listed return, ETag, should be skipped");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
    }

    @Test
    public void testRead_testRead_defaultETag_prod_shouldReadFirstCacheSubsequent() {
        reader.isDev = false;
        Long t0 = System.nanoTime();
        List<String> result1 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t1 = System.nanoTime();
        List<String> result2 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t2 = System.nanoTime();
        List<String> result3 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t3 = System.nanoTime();
        List<String> result4 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t4 = System.nanoTime();
        List<String> result5 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t5 = System.nanoTime();
        List<String> result6 = reader.read("myapplication:static/hugh.jazzit.blob", 0);
        Long t6 = System.nanoTime();

        // All results should have an etag (so 3 long) and status 200
        assertTrue(result1.size() == 3);
        assertTrue(result2.size() == 3);
        assertTrue(result3.size() == 3);
        assertTrue(result4.size() == 3);
        assertTrue(result5.size() == 3);
        assertTrue(result6.size() == 3);
        assertEquals(200, Integer.parseInt(result1.get(0)));
        assertEquals(200, Integer.parseInt(result2.get(0)));
        assertEquals(200, Integer.parseInt(result3.get(0)));
        assertEquals(200, Integer.parseInt(result4.get(0)));
        assertEquals(200, Integer.parseInt(result5.get(0)));
        assertEquals(200, Integer.parseInt(result6.get(0)));

        Long delta1 = t1-t0;
        Long delta2 = t2-t1;
        Long delta3 = t3-t2;
        Long delta4 = t4-t3;
        Long delta5 = t5-t4;
        Long delta6 = t6-t5;

        LOG.info("delta1: " + delta1);
        LOG.info("delta2: " + delta2);
        LOG.info("delta3: " + delta3);
        LOG.info("delta4: " + delta4);
        LOG.info("delta5: " + delta5);
        LOG.info("delta6: " + delta6);
    }
}
