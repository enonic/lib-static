package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.server.RunMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class EtagService implements ScriptBean {
    private final static Logger LOG = LoggerFactory.getLogger( EtagService.class );

    protected static boolean isDev = RunMode.get() != RunMode.PROD;
    protected CachedHasher cachedHasher = new CachedHasher(isDev);
    protected ForceRecacheDecider forceRecacheDecider = new ForceRecacheDecider(isDev);

    protected ResourceService resourceService;

    public static final String STATUS_KEY = "status";
    public static final String ERROR_KEY = "error";
    public static final String ETAG_KEY = "etag";

    /** Gets a content string and MD5-contenthash etag string.
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
    public Map<String, String> getEtag(String path, Integer etagOverrideMode) {
        path = path.trim();
        if (path.endsWith(":") || path.endsWith(":/")) {
            return Map.of(
                STATUS_KEY, "400",
                ERROR_KEY,  "Empty (root) path not allowed."
            );
        }
        if (etagOverrideMode == null) {
            etagOverrideMode = 0;
        }

        Resource resource;
        boolean forceReCache, doProcessEtag;

        try {
            synchronized (resourceService) {
                resource = resourceService.getResource(ResourceKey.from(path));
                if (!resource.exists()) {
                    return Map.of(
                        STATUS_KEY, "404",
                        ERROR_KEY,  "Resource not found: '" + path + "'"
                    );
                }
            }

        } catch (Exception e) {
            LOG.error("Couldn't process resource: '" + path + "'", e);
            if (isDev) {
                e.printStackTrace();
            }
            return Map.of(
                    STATUS_KEY, "500",
                    ERROR_KEY,  "Couldn't process resource: '" + path + "'"
            );
        }

        // TODO: Will this prevent simultaneous access to the same resource? Is it necessary?
        synchronized (resource) {
            forceReCache = forceRecacheDecider.shouldReCache(path, etagOverrideMode, resource);
            doProcessEtag = etagOverrideMode > (isDev ? 0 : -1); // 0: true in prod, false in dev. 1 forces true in dev, -1 forces false in prod.


            try {
                // FIXME: readString doesn't seem cached under the hood???
                // Long t0 = System.nanoTime();
                // String content = resource.readString();
                // Long t1 = System.nanoTime();
                // LOG.info("Read string in nanos: " + ((t1 - t0) / 1000000000F) + "\n---");

                if (doProcessEtag) {
                    // System.out.println("\tforceReCache:   " + forceReCache + "\n");
                    String etag = cachedHasher.getCachedHash(path, resource, forceReCache);
                    return Map.of(
                            STATUS_KEY, "200",
                            ETAG_KEY,  etag
                    );

                } else {
                    return Map.of(
                            STATUS_KEY, "200"
                    );
                }

            } catch (Exception e) {
                LOG.error("Couldn't read resource to string: '" + path + "'", e);
                if (isDev) {
                    e.printStackTrace();
                }
                return Map.of(
                        STATUS_KEY, "500",
                        ERROR_KEY,  "Couldn't read resource: '" + path + "'"
                );
            }
        }
    }

    @Override
    public void initialize(BeanContext context) {
        this.resourceService = context.getService( ResourceService.class ).get();
    }
}
