package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceProcessor;
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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

public class EtagServiceTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( EtagServiceTest.class );

    private EtagService service;

    private Supplier<ResourceService> resourceServiceSupplierMock;
    private ResourceService resourceServiceMock;

    private ProcessorFactory processorFactoryMock = Mockito.mock(ProcessorFactory.class);
    private ResourceProcessor
            staticTextProcessorMock,
            hugeAssetProcessorMock;

    private ResourceKey
            staticTextResourceKey = ResourceKey.from("myapplication:static/static-test-text.txt"),
            hugeAssetResourceKey = ResourceKey.from("myapplication:static/hugh.jazzit.blob");

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

        resourceServiceSupplierMock = Mockito.mock(Supplier.class);
        resourceServiceMock = Mockito.mock(ResourceService.class);

        staticTextProcessorMock = Mockito.mock(ResourceProcessor.class);
        hugeAssetProcessorMock = Mockito.mock(ResourceProcessor.class);

        Mockito.when(resourceServiceSupplierMock.get()).thenReturn(resourceServiceMock);

        Mockito.when(processorFactoryMock.createEtagProcessor(staticTextResourceKey)).thenReturn(staticTextProcessorMock);
        Mockito.when(resourceServiceMock.processResource(staticTextProcessorMock)).thenReturn("Static text hash");

        Mockito.when(processorFactoryMock.createEtagProcessor(hugeAssetResourceKey)).thenReturn(hugeAssetProcessorMock);
        Mockito.when(resourceServiceMock.processResource(hugeAssetProcessorMock)).thenReturn("Huge asset hash");


        service.resourceServiceSupplier = resourceServiceSupplierMock;
        service.processorFactory = processorFactoryMock;
    }

    @Test
    public void testGetEtag_text_prod_defaultETag_shouldReturnTextEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertNull( getError( result ) );
        assertEquals("Static text hash", getETag(result));
    }
    @Test
    public void testGetEtag_huge_prod_defaultETag_shouldReturnHugeEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        assertNull( getError( result ) );
        assertEquals("Huge asset hash", getETag(result));
    }

    @Test
    public void testGetEtag_text_prod_posEtagOverride_shouldReturnTextEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertNull( getError( result ) );
        assertEquals("Static text hash", getETag(result));
    }
    @Test
    public void testGetEtag_huge_prod_posEtagOverride_shouldReturnHugeEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        assertNull( getError( result ) );
        assertEquals("Huge asset hash", getETag(result));
    }

    @Test
    public void testGetEtag_text_prod_negEtagOverride_shouldNotReturnAnyEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertNull( getError( result ) );
        assertNull( getETag(result));
    }
    @Test
    public void testGetEtag_huge_prod_negEtagOverride_shouldNotReturnAnyEtag() {
        service.isDev = false;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", -1);
        assertNull( getError( result ) );
        assertNull( getETag(result) );
    }


    @Test
    public void testGetEtag_text_dev_defaultETag_shouldNotReturnAnyEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 0);
        assertNull( getError( result ) );
        assertNull( getETag(result));
    }
    @Test
    public void testGetEtag_huge_dev_defaultETag_shouldNotReturnAnyEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 0);
        assertNull( getError( result ) );
        assertNull( getETag(result));
    }

    @Test
    public void testGetEtag_text_dev_posEtagOverride_shouldReturnTextEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", 1);
        assertNull( getError( result ) );
        assertEquals("Static text hash", getETag(result));
    }
    @Test
    public void testGetEtag_huge_dev_posEtagOverride_shouldReturnHugeEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", 1);
        assertNull( getError( result ) );
        assertEquals("Huge asset hash", getETag(result));
    }

    @Test
    public void testGetEtag_text_dev_negEtagOverride_shouldNotReturnAnyEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/static-test-text.txt", -1);
        assertNull( getError( result ) );
        assertNull( getETag(result));
    }
    @Test
    public void testGetEtag_huge_dev_negEtagOverride_shouldNotReturnAnyEtag() {
        service.isDev = true;
        Map<String, String> result = service.getEtag("myapplication:static/hugh.jazzit.blob", -1);
        assertNull( getError( result ) );
        assertNull( getETag(result) );
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
        LOG.info("OK: " + getError( result ));
    }
}
