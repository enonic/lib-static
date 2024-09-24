package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceProcessor;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.server.RunMode;

import java.util.Map;
import java.util.function.Supplier;

public class EtagService
    implements ScriptBean
{
    boolean isDev = RunMode.get() == RunMode.DEV;

    Supplier<ResourceService> resourceServiceSupplier;
    ProcessorFactory processorFactory = new ProcessorFactory();


    public static final String ERROR_KEY = "error";
    public static final String ETAG_KEY = "etag";
    private static final Map<String, String> NO_ETAG = Map.of();

    /** Gets a contenthash etag string or an error, at the keys "etag" or "error" in the returned map.
     *
     *
     * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file. Must be already checked and verified.
     * @return (String array) [statusCode, contentOrErrorMessage, etag]
     */
    public Map<String, String> getEtag( String path )
    {
        try
        {
            final ResourceService resourceService = resourceServiceSupplier.get();

            if ( isDev )
            {
              return NO_ETAG;
            }
            else
            {
                // Leaving getResource( resourceKey ) and the actual hasher to the processor:
                ResourceProcessor<ResourceKey, String> processor =  processorFactory.createEtagProcessor( ResourceKey.from(path) );
                final String etag = resourceService.processResource( processor );
                return Map.of( ETAG_KEY, etag );

            }

        }
        catch ( Exception e )
        {
            long errorRnd = (long) ( Math.random() * Long.MAX_VALUE );
            String errorMsg = "Couldn't process etag from resource '" + path + "' (error ID: " + Long.toString( errorRnd, 36 ) + ")";
            return Map.of( ERROR_KEY, errorMsg );
        }
    }

    @Override
    public void initialize( BeanContext context )
    {
        this.resourceServiceSupplier = context.getService( ResourceService.class );
    }
}
