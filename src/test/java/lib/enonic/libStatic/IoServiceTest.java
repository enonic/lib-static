package lib.enonic.libStatic;

import org.junit.jupiter.api.Test;

import com.enonic.xp.testing.ScriptRunnerSupport;

public class IoServiceTest
  extends ScriptRunnerSupport
{
  @Test
  public String getScriptTestFile()
  {
    return "/test/ioservice-test.js";
  }
}
