import com.enonic.xp.testing.ScriptRunnerSupport;

public class EtagReaderTest
        extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/enonic/static/etagReader-test.js";
    }
}
