package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.server.RunMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.function.Supplier;

public class EtagService
    implements ScriptBean
{
    private static final Logger LOG = LoggerFactory.getLogger( EtagService.class );

    boolean isDev = RunMode.get() == RunMode.DEV;

    Supplier<ResourceService> resourceServiceSupplier;
    ProcessorFactory processorFactory = new ProcessorFactory();


    public static final String ERROR_KEY = "error";
    public static final String ETAG_KEY = "etag";
    private static final Map<String, String> NO_ETAG = Map.of();

    public Map<String, String> getEtag( String path )
    {
        return getEtag( path, 0 );
    }

    /** Gets a contenthash etag string or an error, at the keys "etag" or "error" in the returned map.
     *
     *
     * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file. Must be already checked and verified.
     * @param etagOverrideMode (int) if 0 (or null), default handling: in XP prod mode do cached processing without lastModified-checking, and in dev mode skip all etag processing
     *                     Setting to -1 or 1 overrides this:
     *                     * If 1 (actually, > 0) : process and cache etags, even in dev mode.
     *                       - In prod mode: cache the etag by file path only.
     *                       - In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
     *                     * If -1 (actually, < 0) : skips all etag processing and returns no etag string, even in prod.
     * @return (String array) [statusCode, contentOrErrorMessage, etag]
     */
    public Map<String, String> getEtag( String path, Integer etagOverrideMode )
    {
        final ResourceService resourceService = resourceServiceSupplier.get();
        try
        {
            // 0: true in prod, false in dev. 1 forces true in dev, -1 forces false in prod:
            boolean doProcessEtag = etagOverrideMode > ( isDev ? 0 : -1 );

            if ( doProcessEtag )
            {
                // Leaving getResource( resourceKey ) to the processor:
                final String etag = resourceService.processResource( processorFactory.createEtagProcessor( ResourceKey.from( path ) ) );
                LOG.info("1: " + ETAG_KEY + " -> " + etag);
                return Map.of( ETAG_KEY, etag );

            }
            else
            {
                LOG.info("2: Don't process.");
                return NO_ETAG;
            }

        }
        catch ( Exception e )
        {
            long errorRnd = (long) ( Math.random() * Long.MAX_VALUE );
            String errorMsg = "Couldn't process etag from resource '" + path + "' (error ID: " + Long.toString( errorRnd, 36 ) + ")";
            LOG.error(errorMsg, e );
            LOG.info("3: " + ERROR_KEY + " -> " + errorMsg);
            return Map.of( ERROR_KEY, errorMsg );
        }
    }

    @Override
    public void initialize( BeanContext context )
    {
        this.resourceServiceSupplier = context.getService( ResourceService.class );
    }


}
