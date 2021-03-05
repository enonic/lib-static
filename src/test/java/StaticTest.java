import org.junit.Ignore;

import com.enonic.xp.testing.ScriptRunnerSupport;

@Ignore("Until XP 7.7 it does not work")
public class StaticTest
        extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/enonic/static/static-test.js";
    }
}
