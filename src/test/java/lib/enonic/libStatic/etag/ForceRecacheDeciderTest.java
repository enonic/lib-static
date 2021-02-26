package lib.enonic.libStatic.etag;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.testing.ScriptTestSupport;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;


/* Tests: shouldReCache
    - Prod: always return false
    - Dev, and etagOverride is default (0) or -1: always return false
    - Dev, and resource NOT read before (not in prevLastmodifiedDates): return true
    - Dev, and resource IS read before and DOES match date: return false
    - Dev, and resource IS read before and does NOT match date: return true
    - Dev, and resource.getTimestamp fails: return true, then returns true again on first call on that path afterwards
 */


public class ForceRecacheDeciderTest extends ScriptTestSupport {
    private ForceRecacheDecider decider;
    private Resource resourceMock;
    //private HashMap<String, Long> prevLastmodifiedDatesMock;

    private final String APATH = "any/path";
    private final String BPATH = "different/path/b";


    @Override
    protected void initialize() throws Exception {
        super.initialize();
    }

    @Before
    public void setUp() {
        decider = new ForceRecacheDecider(true);
        resourceMock = mock(Resource.class);
        //prevLastmodifiedDatesMock = mock(HashMap.class);
    }

    ///////////////////////////////////////////////////  Prod

    @Test
    public void testShouldReCache_prod_noOverride_shouldAlwaysFalse() {
        decider = new ForceRecacheDecider(false);
        boolean forceRecacheA = decider.shouldReCache(APATH, 0, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 0, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, 0, resourceMock);
        boolean forceRecacheB = decider.shouldReCache(BPATH, 0, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 0, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 0, resourceMock);
        Assert.assertFalse(forceRecacheA);
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(forceRecacheB);
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
    }
    @Test
    public void testShouldReCache_prod_override1_shouldAlwaysFalse() {
        decider = new ForceRecacheDecider(false);
        boolean forceRecacheA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean forceRecacheB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 1, resourceMock);
        Assert.assertFalse(forceRecacheA);
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(forceRecacheB);
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
    }
    @Test
    public void testShouldReCache_prod_overrideMinus1_shouldAlwaysFalse() {
        decider = new ForceRecacheDecider(false);
        boolean forceRecacheA = decider.shouldReCache(APATH, -1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, -1, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, -1, resourceMock);
        boolean forceRecacheB = decider.shouldReCache(BPATH, -1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, -1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, -1, resourceMock);
        Assert.assertFalse(forceRecacheA);
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(forceRecacheB);
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
    }


    ///////////////////////////////////////////////////  Dev

    @Test
    public void testShouldReCache_dev_noOverride_shouldAlwaysFalse() {
        //decider.prevLastmodifiedDates = prevLastmodifiedDatesMock;
        when(resourceMock.getTimestamp()).thenReturn(12345678L);

        boolean firstA = decider.shouldReCache(APATH, 0, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 0, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, 0, resourceMock);
        // Other path, independent results
        boolean firstB = decider.shouldReCache(BPATH, 0, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 0, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 0, resourceMock);

        // Simulate updated file timestamp (doesn't matter, since should not be called)
        when(resourceMock.getTimestamp()).thenReturn(87654321L);

        boolean fourthA = decider.shouldReCache(APATH, 0, resourceMock);

        // Simulate timestamp failure (doesn't matter, since should not be called)
        when(resourceMock.getTimestamp()).thenThrow(new RuntimeException("Oh no"));
        boolean fourthB = decider.shouldReCache(BPATH, 0, resourceMock);

        Assert.assertFalse(firstA);
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(fourthA);
        Assert.assertFalse(firstB);
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertFalse(fourthB);
    }
    @Test
    public void testShouldReCache_dev_overrideMinus1_shouldAlwaysFalse() {
        //decider.prevLastmodifiedDates = prevLastmodifiedDatesMock;
        when(resourceMock.getTimestamp()).thenReturn(12345678L);

        boolean firstA = decider.shouldReCache(APATH, -1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, -1, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, -1, resourceMock);
        // Other path, independent results
        boolean firstB = decider.shouldReCache(BPATH, -1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, -1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, -1, resourceMock);

        // Simulate updated file timestamp (doesn't matter, since should not be called)
        when(resourceMock.getTimestamp()).thenReturn(87654321L);

        boolean fourthA = decider.shouldReCache(APATH, -1, resourceMock);

        // Simulate timestamp failure (doesn't matter, since should not be called)
        when(resourceMock.getTimestamp()).thenThrow(new RuntimeException("Oh no"));
        boolean fourthB = decider.shouldReCache(BPATH, -1, resourceMock);

        Assert.assertFalse(firstA);
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(fourthA);
        Assert.assertFalse(firstB);
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertFalse(fourthB);
    }

    @Test
    public void testShouldReCache_dev_override1Unchanged_shouldTrueWhenNewPath() {
        //decider.prevLastmodifiedDates = prevLastmodifiedDatesMock;
        when(resourceMock.getTimestamp()).thenReturn(12345678L);

        boolean firstA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean fourthA = decider.shouldReCache(APATH, 1, resourceMock);

        // Different path, should yield independent results from APATH:
        boolean firstB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean fourthB = decider.shouldReCache(BPATH, 1, resourceMock);

        Assert.assertTrue(firstA);  // true
        Assert.assertFalse(secondA);
        Assert.assertFalse(thirdA);
        Assert.assertFalse(fourthA);

        Assert.assertTrue(firstB);  // true
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertFalse(fourthB);
    }

    @Test
    public void testShouldReCache_dev_override1Updated_shouldTrueWhenNewPathAndAfterUpdates() {
        //decider.prevLastmodifiedDates = prevLastmodifiedDatesMock;
        when(resourceMock.getTimestamp()).thenReturn(12345678L);
        boolean firstA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 1, resourceMock);

        // Timestamp changes: "file was updated", so the next call on that path should return true - specifically for each path:
        when(resourceMock.getTimestamp()).thenReturn(87654321L);
        boolean thirdA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean fourthA = decider.shouldReCache(APATH, 1, resourceMock);

        // Different path, should yield independent results from APATH:
        when(resourceMock.getTimestamp()).thenReturn(12345678L);
        boolean firstB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 1, resourceMock);
        when(resourceMock.getTimestamp()).thenReturn(87654321L);
        boolean fourthB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean fifthB = decider.shouldReCache(BPATH, 1, resourceMock);

        Assert.assertTrue(firstA);  // true, since first check on that path
        Assert.assertFalse(secondA);
        Assert.assertTrue(thirdA);  // true, since timestamp has changed
        Assert.assertFalse(fourthA);

        Assert.assertTrue(firstB);  // true, since first check on that path
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertTrue(fourthB); // true, since timestamp has changed
        Assert.assertFalse(fifthB);
    }



    @Test
    public void testShouldReCache_dev_override1TimestampFails_shouldTrueWhenFailsAndFirsttimeAfter() {
        //decider.prevLastmodifiedDates = prevLastmodifiedDatesMock;
        when(resourceMock.getTimestamp()).thenReturn(12345678L);
        boolean firstA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 1, resourceMock);

        // Timestamp changes: "file was updated", so the next call on that path should return true - specifically for each path:
        when(resourceMock.getTimestamp()).thenThrow(new RuntimeException("Oh no"));
        boolean thirdA = decider.shouldReCache(APATH, 1, resourceMock);

        Resource resourceMock2 = mock(Resource.class);
        when(resourceMock2.getTimestamp()).thenReturn(12345678L);
        boolean fourthA = decider.shouldReCache(APATH, 1, resourceMock2);
        boolean fifthA = decider.shouldReCache(APATH, 1, resourceMock2);
        boolean sixthA = decider.shouldReCache(APATH, 1, resourceMock2);

        // Different path, should yield independent results from APATH:
        boolean firstB = decider.shouldReCache(BPATH, 1, resourceMock2);
        boolean secondB = decider.shouldReCache(BPATH, 1, resourceMock2);
        boolean thirdB = decider.shouldReCache(BPATH, 1, resourceMock2);
        when(resourceMock2.getTimestamp()).thenThrow(new RuntimeException("Oh no"));
        boolean fourthB = decider.shouldReCache(BPATH, 1, resourceMock2);
        Resource resourceMock3 = mock(Resource.class);
        when(resourceMock3.getTimestamp()).thenReturn(12345678L);
        boolean fifthB = decider.shouldReCache(BPATH, 1, resourceMock3);
        boolean sixthB = decider.shouldReCache(BPATH, 1, resourceMock3);

        Assert.assertTrue(firstA);  // true, since first check on that path
        Assert.assertFalse(secondA);
        Assert.assertTrue(thirdA);  // true, since getTimestamp failed
        Assert.assertTrue(fourthA); // true, since first call after the failure removed the path from prevLastmodifiedDates
        Assert.assertFalse(fifthA);
        Assert.assertFalse(sixthA);

        Assert.assertTrue(firstB);  // true, since first check on that path
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertTrue(fourthB); // true, since getTimestamp failed
        Assert.assertTrue(fifthB); // true, since first call after the failure removed the path from prevLastmodifiedDates
        Assert.assertFalse(sixthB);
    }



    @Test
    public void testShouldReCache_dev_override1TimestampFails_shouldNotBeEffectedByCallOrder() {
        // Same as above, but mixing up the call order between path A and B. Only the point in their individual sequence where each of them get a failure, should matter

        when(resourceMock.getTimestamp()).thenReturn(12345678L);
        boolean firstA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean firstB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean secondB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean secondA = decider.shouldReCache(APATH, 1, resourceMock);
        boolean thirdB = decider.shouldReCache(BPATH, 1, resourceMock);

        // Timestamp changes: "file was updated", so the next call on that path should return true - specifically for each path:
        when(resourceMock.getTimestamp()).thenThrow(new RuntimeException("Oh no"));
        boolean fourthB = decider.shouldReCache(BPATH, 1, resourceMock);
        boolean thirdA = decider.shouldReCache(APATH, 1, resourceMock);

        Resource resourceMock2 = mock(Resource.class);
        when(resourceMock2.getTimestamp()).thenReturn(12345678L);
        boolean fifthB = decider.shouldReCache(BPATH, 1, resourceMock2);
        boolean fourthA = decider.shouldReCache(APATH, 1, resourceMock2);
        boolean fifthA = decider.shouldReCache(APATH, 1, resourceMock2);
        boolean sixthB = decider.shouldReCache(BPATH, 1, resourceMock2);
        boolean sixthA = decider.shouldReCache(APATH, 1, resourceMock2);

        Assert.assertTrue(firstA);  // true, since first check on that path
        Assert.assertFalse(secondA);
        Assert.assertTrue(thirdA);  // true, since getTimestamp failed
        Assert.assertTrue(fourthA); // true, since first call after the failure removed the path from prevLastmodifiedDates
        Assert.assertFalse(fifthA);
        Assert.assertFalse(sixthA);

        Assert.assertTrue(firstB);  // true, since first check on that path
        Assert.assertFalse(secondB);
        Assert.assertFalse(thirdB);
        Assert.assertTrue(fourthB); // true, since getTimestamp failed
        Assert.assertTrue(fifthB); // true, since first call after the failure removed the path from prevLastmodifiedDates
        Assert.assertFalse(sixthB);
    }
}
