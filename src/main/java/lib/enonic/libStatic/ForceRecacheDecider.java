package lib.enonic.libStatic;

import com.enonic.xp.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;

public class ForceRecacheDecider {
    private final static Logger LOG = LoggerFactory.getLogger( ForceRecacheDecider.class );

    protected HashMap<String, Long> prevLastmodifiedDates = new HashMap<>();

    private final boolean isDev;

    public ForceRecacheDecider(boolean isDev) {
        this.isDev = isDev;
    }

    public boolean shouldReCache(String path, Integer etagOverrideMode, Resource resource) {
        // Prod mode: always false -> Always use (and never wipe) etag cache, since static files are immutable in prod
        if (!isDev) {
            return false;
        }

        // Rest: dev mode, where static files may be mutable and we need to decide
        synchronized (prevLastmodifiedDates) {
            if (etagOverrideMode > 0) {
                Long lastModified;
                try {
                    lastModified = resource.getTimestamp();

                } catch (Exception e) {
                    LOG.error("Couldn't read resource last-modified timestamp: '" + path + "'");
                    if (prevLastmodifiedDates.containsKey(path)) {
                        prevLastmodifiedDates.remove(path);
                    }
                    return true;
                }

                if (
                        !prevLastmodifiedDates.containsKey(path) ||
                        !lastModified.equals(prevLastmodifiedDates.get(path))
                ) {
                    prevLastmodifiedDates.put(path, lastModified);
                    return true;
                }
            }
        }

        return false;
    }
}
