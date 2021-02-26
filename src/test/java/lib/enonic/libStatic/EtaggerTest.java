package lib.enonic.libStatic;

import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;

import static org.mockito.Mockito.mock;

/* Tests: getEtag
    - Always return an etag
    - Etag is consistent for one contentBytes
    - Etag is different for two different contentBytes
    - If not forceReCache: cache (use more time) the first call for a specific path, and use cache (save a lot of time for a big asset) for subsequent calls on the same path
    - If not forceReCache: only call cacheAndGetEtag on first call, not subsequent ones
    - If forceReCache: cache on the first call AND subsequent calls (use same time, order of magnitude) on the same path
    - If forceReCache: call cacheAndGetEtag on first call AND subsequent ones
    - If something fails, should catch it and return null
    - If something fails, should wipe path from cache: on first call after failure, should again use time, and save time (and not call cacheAndGetEtag) on later calls after that.
 */
public class CachedEtaggerTest extends ScriptTestSupport {
    private CachedEtagger cachedETagger;
    private Etagger taggerMock;

    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        cachedETagger = new CachedEtagger(false);
        taggerMock = mock(Etagger.class);
    }





    @Test
    public void test_shouldReCache_prod_alwaysFalse() {

    }
}

/* Tests TODO:

 */
