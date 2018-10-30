var Version = "1.0.0";
/**
 * Code adapted from https://stackoverflow.com/a/41407246
 */
var Colours = {
  /**
   * Resets to the default colour
   */
  "Reset": "\x1b[0m",
  /**
   * Brightens the text
   */
  "Bright": "\x1b[1m",
  /**
   * Makes the text bold
   * Note: This is an alias of {@link colours.Bright}
   */
  "Bold": "\x1b[1m",
  /**
   * Dims the text
   */
  "Dim": "\x1b[2m",
  /**
   * Makes the text have an underscore
   */
  "Underscore": "\x1b[4m",
  /**
   * Makes the text blink
   */
  "Blink": "\x1b[5m",
  /**
   * Reverses the text
   */
  "Reverse": "\x1b[7m",
  /**
   * Hides the text
   */
  "Hidden": "\x1b[8m",
  
  /**
   * Makes the text's foreground black
   */
  "FgBlack": "\x1b[30m",
  /**
   * Makes the text's foreground red
   */
  "FgRed": "\x1b[31m",
  /**
   * Makes the text's foreground green
   */
  "FgGreen": "\x1b[32m",
  /**
   * Makes the text's foreground yellow
   */
  "FgYellow": "\x1b[33m",
  /**
   * Makes the text's foreground blue
   */
  "FgBlue": "\x1b[34m",
  /**
   * Makes the text's foreground magneta
   */
  "FgMagenta": "\x1b[35m",
  /**
   * Makes the text's foreground cyan
   */
  "FgCyan": "\x1b[36m",
  /**
   * Makes the text's foreground white
   */
  "FgWhite": "\x1b[37m",
  
  /**
   * Makes the text's background black
   */
  "BgBlack": "\x1b[40m",
  /**
   * Makes the text's background red
   */
  "BgRed": "\x1b[41m",
  /**
   * Makes the text's background green
   */
  "BgGreen": "\x1b[42m",
  /**
   * Makes the text's background yellow
   */
  "BgYellow": "\x1b[43m",
  /**
   * Makes the text's background blue
   */
  "BgBlue": "\x1b[44m",
  /**
   * Makes the text's background magneta
   */
  "BgMagenta": "\x1b[45m",
  /**
   * Makes the text's background cyan
   */
  "BgCyan": "\x1b[46m",
  /**
   * Makes the text's background white
   */
  "BgWhite": "\x1b[47m"
};
// An alias of the above object
var COLOURS = {
  /**
   * Resets to the default colour
   */
  "RESET": "\x1b[0m",
  /**
   * Brightens the text
   */
  "BRIGHT": "\x1b[1m",
  /**
   * Makes the text bold
   * Note: This is an alias of {@link colours.BRIGHT}
   */
  "BRIGHT": "\x1b[1m",
  /**
   * Dims the text
   */
  "DIM": "\x1b[2m",
  /**
   * Makes the text have an underscore
   */
  "UNDERSCORE": "\x1b[4m",
  /**
   * Makes the text blink
   */
  "BLINK": "\x1b[5m",
  /**
   * Reverses the text
   */
  "REVERSE": "\x1b[7m",
  /**
   * Hides the text
   */
  "HIDDEN": "\x1b[8m",
  
  /**
   * Makes the text's foreground black
   */
  "FGBLACK": "\x1b[30m",
  /**
   * Makes the text's foreground red
   */
  "FGRED": "\x1b[31m",
  /**
   * Makes the text's foreground green
   */
  "FGGREEN": "\x1b[32m",
  /**
   * Makes the text's foreground yellow
   */
  "FGYELLOW": "\x1b[33m",
  /**
   * Makes the text's foreground blue
   */
  "FGBLUE": "\x1b[34m",
  /**
   * Makes the text's foreground magneta
   */
  "FGMAGENTA": "\x1b[35m",
  /**
   * Makes the text's foreground cyan
   */
  "FGCYAN": "\x1b[36m",
  /**
   * Makes the text's foreground white
   */
  "FGWHITE": "\x1b[37m",
  
  /**
   * Makes the text's background black
   */
  "BGBLACK": "\x1b[40m",
  /**
   * Makes the text's background red
   */
  "BGRED": "\x1b[41m",
  /**
   * Makes the text's background green
   */
  "BGGREEN": "\x1b[42m",
  /**
   * Makes the text's background yellow
   */
  "BGYELLOW": "\x1b[43m",
  /**
   * Makes the text's background blue
   */
  "BGBLUE": "\x1b[44m",
  /**
   * Makes the text's background magneta
   */
  "BGMAGENTA": "\x1b[45m",
  /**
   * Makes the text's background cyan
   */
  "BGCYAN": "\x1b[46m",
  /**
   * Makes the text's background white
   */
  "BGWHITE": "\x1b[47m"
};
// Another alias of the colours object
var colours = {
  /**
   * Resets to the default colour
   */
  "reset": "\x1b[0m",
  /**
   * Brightens the text
   */
  "bright": "\x1b[1m",
  /**
   * Makes the text bold
   * Note: This is an alias of {@link colours.bright}
   */
  "bold": "\x1b[1m",
  /**
   * Dims the text
   */
  "dim": "\x1b[2m",
  /**
   * Makes the text have an underscore
   */
  "underscore": "\x1b[4m",
  /**
   * Makes the text blink
   */
  "blink": "\x1b[5m",
  /**
   * Reverses the text
   */
  "reverse": "\x1b[7m",
  /**
   * Hides the text
   */
  "hidden": "\x1b[8m",
  
  /**
   * Makes the text's foreground black
   */
  "fgblack": "\x1b[30m",
  /**
   * Makes the text's foreground red
   */
  "fgred": "\x1b[31m",
  /**
   * Makes the text's foreground green
   */
  "fggreen": "\x1b[32m",
  /**
   * Makes the text's foreground yellow
   */
  "fgyellow": "\x1b[33m",
  /**
   * Makes the text's foreground blue
   */
  "fgblue": "\x1b[34m",
  /**
   * Makes the text's foreground magneta
   */
  "fgmagenta": "\x1b[35m",
  /**
   * Makes the text's foreground cyan
   */
  "fgcyan": "\x1b[36m",
  /**
   * Makes the text's foreground white
   */
  "fgwhite": "\x1b[37m",
  
  /**
   * Makes the text's background black
   */
  "bgblack": "\x1b[40m",
  /**
   * Makes the text's background red
   */
  "bgred": "\x1b[41m",
  /**
   * Makes the text's background green
   */
  "bggreen": "\x1b[42m",
  /**
   * Makes the text's background yellow
   */
  "bgyellow": "\x1b[43m",
  /**
   * Makes the text's background blue
   */
  "bgblue": "\x1b[44m",
  /**
   * Makes the text's background magneta
   */
  "bgmagenta": "\x1b[45m",
  /**
   * Makes the text's background cyan
   */
  "bgcyan": "\x1b[46m",
  /**
   * Makes the text's background white
   */
  "bgwhite": "\x1b[47m"
};

// For you American people
exports.Colors = Colours;
exports.COLORS = COLOURS;
exports.colors = colours;
// The rest of the world
exports.Colours = Colours;
exports.COLOURS = COLOURS;
exports.colours = colours;

exports.Version = Version;
exports.version = Version;
exports.VERSION = Version;