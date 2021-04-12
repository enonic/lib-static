package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceProcessor;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;

import static org.junit.Assert.assertEquals;

/**
 * Created on 22/03/2021 as part of
 */
public class ProcessFactoryTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger(HasherTest.class);

    private ProcessorFactory factory;

    private Hasher hasherMock;
    private Resource resourceMock;

    private byte[] RESOURCE_CONTENT_BYTES = "Svært svært svært svært, magisk, episk, spektakulært, heilt overjordisk og uordinært, me er dei sværast' i heile verda".getBytes(StandardCharsets.UTF_8);

    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        factory = new ProcessorFactory();

        hasherMock = Mockito.mock(Hasher.class);
        resourceMock = Mockito.mock(Resource.class);
        Mockito.when(resourceMock.exists()).thenReturn(true);
        Mockito.when(resourceMock.readBytes()).thenReturn(RESOURCE_CONTENT_BYTES);
        Mockito.when(hasherMock.getHash(RESOURCE_CONTENT_BYTES)).thenReturn("12345678");

        factory.hasher = hasherMock;
    }

    @Test
    public void testProcessFactory_runsHasher() {
        ResourceProcessor<ResourceKey, String> processor = factory.createEtagProcessor( ResourceKey.from("heisann:/hopp/sann") );
        processor.process( resourceMock );

        Mockito.verify(hasherMock, Mockito.times(1)).getHash(RESOURCE_CONTENT_BYTES);
    }

    @Test
    public void testProcessFactory_returnsHasherResultInQuotes() {
        ResourceProcessor<ResourceKey, String> processor = factory.createEtagProcessor( ResourceKey.from("heisann:/hopp/sann") );
        String result = processor.process( resourceMock );

        assertEquals("\"12345678\"", result);
    }
}
