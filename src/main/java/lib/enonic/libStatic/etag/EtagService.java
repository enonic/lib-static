package lib.enonic.libStatic.etag;

import java.util.Map;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceProcessor;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.server.RunMode;

public class EtagService
    implements ScriptBean
{
    private static final Logger LOG = LoggerFactory.getLogger( EtagService.class );

    private static final Hasher HASHER = new Hasher();

    protected static boolean isDev = RunMode.get() != RunMode.PROD;

    private Supplier<ResourceService> resourceServiceSupplier;

    public static final String STATUS_KEY = "status";

    public static final String ERROR_KEY = "error";

    public static final String ETAG_KEY = "etag";

    public Map<String, String> getEtag( String path )
    {
        return getEtag( path, 0 );
    }

    /** Gets a content string and contenthash etag string.
     *
     *
     * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file
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
        path = path.trim();
        if ( path.endsWith( ":" ) || path.endsWith( ":/" ) )
        {
            return Map.of( STATUS_KEY, "400", ERROR_KEY, "Empty (root) path not allowed." );
        }
        if ( etagOverrideMode == null )
        {
            etagOverrideMode = 0;
        }

        final ResourceService resourceService = resourceServiceSupplier.get();
        try
        {
            Resource resource = resourceService.getResource( ResourceKey.from( path ) );
            if ( !resource.exists() )
            {
                return Map.of( STATUS_KEY, "404", ERROR_KEY, "Resource not found: '" + path + "'" );
            }

            boolean doProcessEtag =
                etagOverrideMode > ( isDev ? 0 : -1 ); // 0: true in prod, false in dev. 1 forces true in dev, -1 forces false in prod.

            if ( doProcessEtag )
            {
                final String etag = resourceService.processResource( createEtagProcessor( resource.getKey() ) );
                return Map.of( STATUS_KEY, "200", ETAG_KEY, etag );

            }
            else
            {
                return Map.of( STATUS_KEY, "200" );
            }

        }
        catch ( Exception e )
        {
            long errorRnd = (long) ( Math.random() * Long.MAX_VALUE );
            String errorId = Long.toString( errorRnd, 36 );
            LOG.error( "Couldn't process etag: '" + path + "' (error ID: " + errorId + ")", e );
            return Map.of( STATUS_KEY, "500", ERROR_KEY, "Couldn't process etag: '" + path + "' (error ID: " + errorId + ")" );
        }
    }

    @Override
    public void initialize( BeanContext context )
    {
        this.resourceServiceSupplier = context.getService( ResourceService.class );
    }

    private static ResourceProcessor<ResourceKey, String> createEtagProcessor( final ResourceKey key )
    {
        return new ResourceProcessor.Builder<ResourceKey, String>().
            key( key ).
            segment( "lib-static" ).
            keyTranslator( k -> k ).
            processor( resource -> "\"" + HASHER.getHash( resource.readBytes() ) + "\"" ).
            build();
    }
}
