package lib.enonic.libStatic;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/* Tests: getCachedEtag
    - If not forceReCache: cache (use more time) the first call for a specific path, and use cache (save a lot of time for a big asset) for subsequent calls on the same path
    - If not forceReCache: subsequent cached calls return same etag as the first one
    - If not forceReCache: only call etagger.getEtag on first call, not subsequent ones
    - If forceReCache: cache on the first call AND subsequent calls (use same time, order of magnitude) on the same path
    - If forceReCache: subsequent calls return same etag as the first one
    - If forceReCache: call etagger.getEtag on every call
    - If something fails, should catch it and return null
    - If something fails, should wipe path from cache: on first call after failure, should again use time, and save time (and not call cacheAndGetEtag) on later calls after that.
 */
public class CachedEtaggerTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( CachedEtaggerTest.class );

    private CachedEtagger cachedETagger;
    private Etagger etaggerMock;


    private final String HUGE_PATH = "myapplication:/static/hugh.jazzit.blob";
    private final String TEXT_PATH = "myapplication:/static/static-test-text.txt";
    private final String GIF_PATH = "myapplication:/static/w3c_home.gif";

    private Resource hugeAsset1,
            hugeAsset2,
            hugeAsset3,
            hugeAsset4,
            hugeAsset5,
            hugeAsset6,
            textAsset1,
            textAsset2,
            textAsset3,
            gifAsset1,
            gifAsset2,
            gifAsset3;


    @Override
    protected void initialize() throws Exception {
        super.initialize();

        BeanContext context = newBeanContext(ResourceKey.from("myapplication:/test"));
        ResourceService resourceService = context.getService( ResourceService.class ).get();

        hugeAsset1 = resourceService.getResource(ResourceKey.from(HUGE_PATH));
        hugeAsset2 = resourceService.getResource(ResourceKey.from(HUGE_PATH));
        hugeAsset3 = resourceService.getResource(ResourceKey.from(HUGE_PATH));
        hugeAsset4 = resourceService.getResource(ResourceKey.from(HUGE_PATH));
        hugeAsset5 = resourceService.getResource(ResourceKey.from(HUGE_PATH));
        hugeAsset6 = resourceService.getResource(ResourceKey.from(HUGE_PATH));

        textAsset1 = resourceService.getResource(ResourceKey.from(TEXT_PATH));
        textAsset2 = resourceService.getResource(ResourceKey.from(TEXT_PATH));
        textAsset3 = resourceService.getResource(ResourceKey.from(TEXT_PATH));


        gifAsset1 = resourceService.getResource(ResourceKey.from(GIF_PATH));
        gifAsset2 = resourceService.getResource(ResourceKey.from(GIF_PATH));
        gifAsset3 = resourceService.getResource(ResourceKey.from(GIF_PATH));
    }

    @Before
    public void setUp() {
        cachedETagger = new CachedEtagger(false);
        etaggerMock = mock(Etagger.class);
    }





    @Test
    public void testGetCachedEtag_noForceRecache_shouldConsistentEtagAndSubsequentCallsMuchFasterThanFirstCall() {

        Long time0 = System.nanoTime();
        String etag1 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset1, false);
        Long time1 = System.nanoTime();

        String etag2 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset2, false);
        String etag3 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset3, false);
        String etag4 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset4, false);
        String etag5 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset5, false);
        String etag6 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset6, false);
        Long time6 = System.nanoTime();

        // Nanoseconds
        Long delta1 = (time1 - time0);
        Long avgDelta6 = (long)((time6 - time1) / 5f);

        LOG.info("delta1:    " + delta1);
        LOG.info("avgDelta6: " + avgDelta6);

        // Expected: the first call of getCachedEtag took much, much longer than the average of the subsequent five calls, since the huge asset is 23 MB and the subsequent calls are cached
        assertTrue(delta1 / avgDelta6 > 100);

        assertEquals(etag1, etag2);
        assertEquals(etag2, etag3);
        assertEquals(etag3, etag4);
        assertEquals(etag4, etag5);
        assertEquals(etag5, etag6);
    }


    @Test
    public void testGetCachedEtag_noForceRecache_shouldOnlyCallGetEtagOnFirstCallByPath() throws NoSuchAlgorithmException {

        // Mixing up order of paths. Shouldn't matter: subsequent calls not call etagger.getEtag
        when(etaggerMock.getEtag(any(byte[].class))).thenReturn("Im a mock etag");
        cachedETagger.etagger = etaggerMock;

        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset1, false);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset1, false);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset2, false);
        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset2, false);
        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset3, false);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset3, false);

        // etaggerMock.getEtag called exactly twice, because two different paths are used, cached once each.
        verify(etaggerMock, times(2)).getEtag(any(byte[].class));
    }



    @Test
    public void testGetCachedEtag_forceRecache_shouldConsistentEtagAndCallTimes() {
        ArrayList<Long> deltas = new ArrayList<>();
        Long old, neww;
        old = System.nanoTime();

        String etag1 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset1, true);
        neww = System.nanoTime();
        deltas.add(neww-old);
        old = neww;

        String etag2 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset2, true);
        neww = System.nanoTime();
        deltas.add(neww-old);
        old = neww;

        String etag3 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset3, true);
        neww = System.nanoTime();
        deltas.add(neww-old);
        old = neww;

        String etag4 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset4, true);
        neww = System.nanoTime();
        deltas.add(neww-old);
        old = neww;

        String etag5 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset5, true);
        neww = System.nanoTime();
        deltas.add(neww-old);
        old = neww;

        String etag6 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset6, true);
        neww = System.nanoTime();
        deltas.add(neww-old);

        Collections.sort(deltas);


        // Delta times for the six calls now sorted ASC.
        Long shortest = deltas.get(0);
        Long longest = deltas.get(5);
        LOG.info("Shortest delta: " + shortest);
        LOG.info("Longest delta:  " + longest);

        // Testing for performance consistency:
        // allowing some slack for fastest and slowest outliers, they still shouldn't be too far apart, say, below a difference factor of 3.
        assertTrue(longest / shortest < 3);

        // They should still generate the same tag every time
        assertEquals(etag1, etag2);
        assertEquals(etag2, etag3);
        assertEquals(etag3, etag4);
        assertEquals(etag4, etag5);
        assertEquals(etag5, etag6);
    }

    @Test
    public void testGetCachedEtag_forceRecache_shouldCallGetEtagOnEveryCall() throws NoSuchAlgorithmException {

        // Mixing up order of paths. Shouldn't matter: subsequent calls not call etagger.getEtag
        when(etaggerMock.getEtag(Mockito.any(byte[].class))).thenReturn("Im a mock etag");
        cachedETagger.etagger = etaggerMock;

        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset1, true);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset1, true);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset2, true);
        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset2, true);
        cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset3, true);
        cachedETagger.getCachedEtag(TEXT_PATH, textAsset3, true);

        // etaggerMock.getEtag called every time twice, because forceRecache forces a new etag.
        Mockito.verify(etaggerMock, Mockito.times(6)).getEtag(Mockito.any(byte[].class));
    }


    @Test
    public void testGetCachedEtag_handleFailure_shouldReturnNullAndRemoveCachedPath() throws NoSuchAlgorithmException, IOException {

        byte[] hugeAssetBytes1 = hugeAsset1.getBytes().read();
        byte[] hugeAssetBytes2 = hugeAsset2.getBytes().read();
        byte[] textAssetBytes1 = textAsset1.getBytes().read();
        byte[] gifAssetBytes1 = gifAsset1.getBytes().read();

        cachedETagger.etagger = etaggerMock;
        when(etaggerMock.getEtag(hugeAssetBytes1)).thenReturn("I am huge etag");
        when(etaggerMock.getEtag(hugeAssetBytes2)).thenReturn("I am huge etag");
        when(etaggerMock.getEtag(textAssetBytes1)).thenReturn("I am text etag");
        when(etaggerMock.getEtag(gifAssetBytes1)).thenThrow(new RuntimeException("Oh no I can't remember how GIF is pronounced"));

        String etag1 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset1, false);
        // Should have been called once
        verify(etaggerMock, times(1)).getEtag(any(byte[].class));

        String etag2 = cachedETagger.getCachedEtag(HUGE_PATH, hugeAsset2, false);
        // Should still have been called only once - the first time, since the second time was cached
        verify(etaggerMock, times(1)).getEtag(any(byte[].class));

        String etag3 = cachedETagger.getCachedEtag(TEXT_PATH, textAsset1, false);
        // Should have been called one more time now - new path
        verify(etaggerMock, times(2)).getEtag(any(byte[].class));

        HashMap<String, String> etagCacheMock = mock(HashMap.class);
        when(etagCacheMock.containsKey(any(String.class))).thenReturn(false);
        cachedETagger.etagCache = etagCacheMock;

        String etag4 = cachedETagger.getCachedEtag(GIF_PATH, gifAsset1, true);

        verify(etagCacheMock, never()).put(any(String.class), any(String.class));
        verify(etagCacheMock, times(1)).remove(GIF_PATH);

        assertEquals("I am huge etag", etag1);
        assertEquals("I am huge etag", etag2);
        assertEquals("I am text etag", etag3);
        assertEquals(null, etag4);
    }
}
