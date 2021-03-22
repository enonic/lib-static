package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceProcessor;

/**
 * Created on 22/03/2021 as part of
 */
public class ProcessorFactory {

    Hasher hasher = new Hasher();
    public ResourceProcessor<ResourceKey, String> createEtagProcessor(final ResourceKey key)
    {
        return new ResourceProcessor.Builder<ResourceKey, String>().
                key( key ).
                segment( "lib-static" ).
                keyTranslator( k -> k ).
                processor( resource -> "\"" + hasher.getHash( resource.readBytes() ) + "\"" ).
                build();
    }
}
