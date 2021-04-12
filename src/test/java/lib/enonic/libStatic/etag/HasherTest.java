package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/* Tests: getEtag
    - Always return an etag
    - Etag is consistent for one contentBytes
    - Etag is different for two different contentBytes
    - Handles huge bytearrays
 */
public class HasherTest extends ScriptTestSupport {
    private final static Logger LOG = LoggerFactory.getLogger( HasherTest.class );

    private Hasher hasher;

    private byte[] hugeAssetBytes1,
            hugeAssetBytes2,
            textAssetBytes1,
            textAssetBytes2,
            gifAssetBytes1,
            gifAssetBytes2;


    @Override
    protected void initialize() throws Exception {
        super.initialize();

        BeanContext context = newBeanContext(ResourceKey.from("myapplication:/test"));
        ResourceService resourceService = context.getService( ResourceService.class ).get();

        Resource hugeAsset = resourceService.getResource(ResourceKey.from("myapplication:/static/hugh.jazzit.blob"));
        hugeAssetBytes1 = hugeAsset.getBytes().read();
        hugeAssetBytes2 = hugeAsset.getBytes().read();

        Resource textAsset = resourceService.getResource(ResourceKey.from("myapplication:/static/static-test-text.txt"));
        textAssetBytes1 = textAsset.getBytes().read();
        textAssetBytes2 = textAsset.getBytes().read();

        Resource gifAsset = resourceService.getResource(ResourceKey.from("myapplication:/static/w3c_home.gif"));
        gifAssetBytes1 = gifAsset.getBytes().read();
        gifAssetBytes2 = gifAsset.getBytes().read();
    }

    @Before
    public void setUp() {
        hasher = new Hasher();
    }



    @Test
    public void testGetHash_shouldDifferentForDifferentContentBytes() {
        String hugeEtag = hasher.getHash(hugeAssetBytes1);
        String textEtag = hasher.getHash(textAssetBytes1);
        String gifEtag = hasher.getHash(gifAssetBytes1);

        LOG.info("Huge etag: " + hugeEtag);
        LOG.info("Text etag: " + textEtag);
        LOG.info("GIF etag:  " + gifEtag);

        Assert.assertNotEquals(hugeEtag, textEtag);
        Assert.assertNotEquals(hugeEtag, gifEtag);
        Assert.assertNotEquals(textEtag, gifEtag);
    }

    @Test
    public void testGetHash_shouldConsistentForSameContentBytes() {
        String hugeEtag1 = hasher.getHash(hugeAssetBytes1);
        String hugeEtag2 = hasher.getHash(hugeAssetBytes2);

        String textEtag1 = hasher.getHash(textAssetBytes1);
        String textEtag2 = hasher.getHash(textAssetBytes2);

        String gifEtag1 = hasher.getHash(gifAssetBytes1);
        String gifEtag2 = hasher.getHash(gifAssetBytes2);

        Assert.assertEquals(hugeEtag1, hugeEtag2);
        Assert.assertEquals(textEtag1, textEtag2);
        Assert.assertEquals(gifEtag1, gifEtag2);
    }

    @Test
    public void testGetHash_expectTimeDifferenceForHugeResource() {
        Long zero = System.nanoTime();
        hasher.getHash(hugeAssetBytes1);
        hasher.getHash(hugeAssetBytes2);
        Long one = System.nanoTime();

        hasher.getHash(textAssetBytes1);
        hasher.getHash(textAssetBytes2);
        Long two = System.nanoTime();

        hasher.getHash(gifAssetBytes1);
        hasher.getHash(gifAssetBytes2);
        Long three = System.nanoTime();

        // Nanoseconds x 2
        Long hugeTime = (one - zero);
        Long textTime = (two - one);
        Long gifTime = (three - two);

        // Microseconds
        LOG.info("Huge etag microseconds: " + hugeTime / 2000);
        LOG.info("Text etag microseconds: " + textTime / 2000);
        LOG.info("GIF etag microseconds:  " + gifTime / 2000);

        // Expected: hugeTime is much, much bigger than the two next since the huge asset is 23 MB
        Assert.assertTrue(hugeTime / textTime > 100);
        Assert.assertTrue(hugeTime / gifTime > 100);
    }
}
