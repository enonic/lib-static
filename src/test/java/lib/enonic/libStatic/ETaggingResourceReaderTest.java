package lib.enonic.libStatic;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ETaggingResourceReaderTest extends ScriptTestSupport {
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
    public void testRead() {
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        assertTrue(result.size() > 1); // , "Valid resource request, so there should be at least 2 items returned: status and body");
        assertEquals(200, Integer.parseInt(result.get(0))); // , "Status should be 200");
        assertEquals(result.get(1), "I am a test text\n"); // , "File body should be returned");
    }

    @Test
    public void testRead_defaultETag_prod() {
        reader.isDev = false;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        assertTrue(result.size() > 2); //, "Default etagOverride, so in prod there should be at least 3 items returned - the third should be the ETag.");
        assertTrue(result.get(2).trim().length() > 0); //, "The third returned string (ETag) should not be empty");
    }

    @Test
    public void testRead_defaultETag_dev() {
        reader.isDev = true;
        List<String> result = reader.read("myapplication:static/static-test-text.txt", 0);
        for (String item : result) {
            System.out.println("\tITEM: " + item);
        }
    }
}




        /*/
        importDocCommand = new ImportDocCommand();
        importDocCommand.setImportPath(importPath);
        importDocCommand.sourceDir = new File(getPath("docs")).toPath().normalize().toAbsolutePath();
        importDocCommand.setLabel("beta");

        final BeanContext beanContext = Mockito.mock(BeanContext.class);
        final Supplier<ContentService> serviceSupplier = Mockito.mock(Supplier.class);
        Mockito.when(beanContext.getService(ContentService.class)).thenReturn(serviceSupplier);
        Mockito.when(serviceSupplier.get()).thenReturn(contentService);
        Mockito.when(contentService.create(Mockito.any(CreateContentParams.class))).thenReturn(
                Content.create().name("beta").parentPath(ContentPath.ROOT).build());

        reader.initialize(beanContext);
        //*/
