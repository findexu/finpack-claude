// Hand-authored pixel-art code-mage as an SVG rect grid (64x64 logical pixels,
// 16u each on a 1024 grid). viewBox is cropped to the figure so it fills the
// avatar box. Animation is driven by CSS classes (hero-body / hero-orb /
// hero-eyes) defined in buildCharacterSheet's nonce'd <style>; no inline styles
// or scripts, so it is CSP-safe. Used as the avatar placeholder until a real
// avatar.png is vendored.
export const HERO_SVG = `<svg class="avatar-hero" viewBox="248 80 312 384" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="Pixel-art code-mage adventurer holding a staff with a glowing braces orb and a spellbook">
  <g class="hero-body">
    <g fill="#4a2f1b">
      <rect x="368" y="96" width="16" height="16"/><rect x="400" y="96" width="16" height="16"/><rect x="432" y="96" width="16" height="16"/>
      <rect x="352" y="112" width="16" height="16"/><rect x="384" y="112" width="16" height="16"/><rect x="416" y="112" width="16" height="16"/><rect x="448" y="112" width="16" height="16"/>
      <rect x="336" y="128" width="16" height="16"/><rect x="464" y="128" width="16" height="16"/>
      <rect x="320" y="144" width="16" height="16"/><rect x="480" y="144" width="16" height="16"/>
    </g>
    <g fill="#6e4528">
      <rect x="384" y="96" width="16" height="16"/><rect x="416" y="96" width="16" height="16"/>
      <rect x="336" y="112" width="16" height="16"/><rect x="368" y="112" width="16" height="16"/><rect x="400" y="112" width="16" height="16"/><rect x="432" y="112" width="16" height="16"/>
      <rect x="352" y="128" width="16" height="16"/><rect x="368" y="128" width="16" height="16"/><rect x="384" y="128" width="16" height="16"/><rect x="400" y="128" width="16" height="16"/><rect x="416" y="128" width="16" height="16"/><rect x="432" y="128" width="16" height="16"/><rect x="448" y="128" width="16" height="16"/>
      <rect x="336" y="144" width="16" height="16"/><rect x="464" y="144" width="16" height="16"/>
    </g>
    <g fill="#f1c79b">
      <rect x="352" y="144" width="16" height="16"/><rect x="368" y="144" width="16" height="16"/><rect x="384" y="144" width="16" height="16"/><rect x="400" y="144" width="16" height="16"/><rect x="416" y="144" width="16" height="16"/><rect x="432" y="144" width="16" height="16"/><rect x="448" y="144" width="16" height="16"/>
      <rect x="336" y="160" width="16" height="16"/><rect x="352" y="160" width="16" height="16"/><rect x="464" y="160" width="16" height="16"/>
      <rect x="336" y="176" width="16" height="16"/><rect x="352" y="176" width="16" height="16"/><rect x="368" y="176" width="16" height="16"/><rect x="384" y="176" width="16" height="16"/><rect x="400" y="176" width="16" height="16"/><rect x="416" y="176" width="16" height="16"/><rect x="432" y="176" width="16" height="16"/><rect x="448" y="176" width="16" height="16"/><rect x="464" y="176" width="16" height="16"/>
      <rect x="352" y="192" width="16" height="16"/><rect x="368" y="192" width="16" height="16"/><rect x="400" y="192" width="16" height="16"/><rect x="416" y="192" width="16" height="16"/><rect x="448" y="192" width="16" height="16"/>
      <rect x="368" y="208" width="16" height="16"/><rect x="384" y="208" width="16" height="16"/><rect x="416" y="208" width="16" height="16"/><rect x="432" y="208" width="16" height="16"/>
      <rect x="384" y="224" width="16" height="16"/><rect x="400" y="224" width="16" height="16"/><rect x="416" y="224" width="16" height="16"/>
    </g>
    <g class="hero-eyes" fill="#15110d">
      <rect x="352" y="160" width="16" height="16"/><rect x="368" y="160" width="16" height="16"/><rect x="384" y="160" width="16" height="16"/><rect x="416" y="160" width="16" height="16"/><rect x="432" y="160" width="16" height="16"/><rect x="448" y="160" width="16" height="16"/><rect x="400" y="160" width="16" height="16"/>
    </g>
    <g fill="#b5764a">
      <rect x="384" y="192" width="16" height="16"/><rect x="432" y="192" width="16" height="16"/>
    </g>
    <g fill="#1f5d34">
      <rect x="320" y="160" width="16" height="16"/><rect x="320" y="176" width="16" height="16"/><rect x="480" y="160" width="16" height="16"/><rect x="480" y="176" width="16" height="16"/>
      <rect x="320" y="240" width="16" height="16"/><rect x="336" y="240" width="16" height="16"/><rect x="464" y="240" width="16" height="16"/><rect x="480" y="240" width="16" height="16"/>
      <rect x="304" y="256" width="16" height="16"/><rect x="320" y="256" width="16" height="16"/><rect x="480" y="256" width="16" height="16"/><rect x="496" y="256" width="16" height="16"/>
      <rect x="304" y="272" width="16" height="16"/><rect x="496" y="272" width="16" height="16"/>
      <rect x="304" y="288" width="16" height="16"/><rect x="496" y="288" width="16" height="16"/>
      <rect x="304" y="304" width="16" height="16"/><rect x="496" y="304" width="16" height="16"/>
      <rect x="304" y="320" width="16" height="16"/><rect x="496" y="320" width="16" height="16"/>
      <rect x="320" y="336" width="16" height="16"/><rect x="480" y="336" width="16" height="16"/>
    </g>
    <g fill="#2f8a4d">
      <rect x="352" y="240" width="16" height="16"/><rect x="448" y="240" width="16" height="16"/>
      <rect x="336" y="256" width="16" height="16"/><rect x="464" y="256" width="16" height="16"/>
      <rect x="320" y="272" width="16" height="16"/><rect x="480" y="272" width="16" height="16"/>
      <rect x="320" y="288" width="16" height="16"/><rect x="480" y="288" width="16" height="16"/>
      <rect x="320" y="304" width="16" height="16"/><rect x="480" y="304" width="16" height="16"/>
    </g>
    <g fill="#7a4a23">
      <rect x="368" y="240" width="16" height="16"/><rect x="384" y="240" width="16" height="16"/><rect x="400" y="240" width="16" height="16"/><rect x="416" y="240" width="16" height="16"/><rect x="432" y="240" width="16" height="16"/>
      <rect x="352" y="256" width="16" height="16"/><rect x="368" y="256" width="16" height="16"/><rect x="400" y="256" width="16" height="16"/><rect x="432" y="256" width="16" height="16"/><rect x="448" y="256" width="16" height="16"/>
      <rect x="336" y="272" width="16" height="16"/><rect x="352" y="272" width="16" height="16"/><rect x="368" y="272" width="16" height="16"/><rect x="400" y="272" width="16" height="16"/><rect x="432" y="272" width="16" height="16"/><rect x="448" y="272" width="16" height="16"/><rect x="464" y="272" width="16" height="16"/>
      <rect x="336" y="288" width="16" height="16"/><rect x="352" y="288" width="16" height="16"/><rect x="368" y="288" width="16" height="16"/><rect x="384" y="288" width="16" height="16"/><rect x="400" y="288" width="16" height="16"/><rect x="416" y="288" width="16" height="16"/><rect x="432" y="288" width="16" height="16"/><rect x="448" y="288" width="16" height="16"/><rect x="464" y="288" width="16" height="16"/>
      <rect x="336" y="304" width="16" height="16"/><rect x="352" y="304" width="16" height="16"/><rect x="368" y="304" width="16" height="16"/><rect x="384" y="304" width="16" height="16"/><rect x="400" y="304" width="16" height="16"/><rect x="416" y="304" width="16" height="16"/><rect x="432" y="304" width="16" height="16"/><rect x="448" y="304" width="16" height="16"/><rect x="464" y="304" width="16" height="16"/>
      <rect x="336" y="320" width="16" height="16"/><rect x="352" y="320" width="16" height="16"/><rect x="368" y="320" width="16" height="16"/><rect x="400" y="320" width="16" height="16"/><rect x="416" y="320" width="16" height="16"/><rect x="448" y="320" width="16" height="16"/><rect x="464" y="320" width="16" height="16"/>
    </g>
    <g fill="#5a3417">
      <rect x="384" y="256" width="16" height="16"/><rect x="416" y="256" width="16" height="16"/>
      <rect x="384" y="272" width="16" height="16"/><rect x="416" y="272" width="16" height="16"/>
      <rect x="336" y="336" width="16" height="16"/><rect x="352" y="336" width="16" height="16"/><rect x="368" y="336" width="16" height="16"/><rect x="384" y="336" width="16" height="16"/><rect x="400" y="336" width="16" height="16"/><rect x="416" y="336" width="16" height="16"/><rect x="432" y="336" width="16" height="16"/><rect x="448" y="336" width="16" height="16"/><rect x="464" y="336" width="16" height="16"/>
    </g>
    <g fill="#e2b13c"><rect x="400" y="336" width="16" height="16"/></g>
    <g fill="#1f2747">
      <rect x="352" y="352" width="16" height="16"/><rect x="368" y="352" width="16" height="16"/><rect x="384" y="352" width="16" height="16"/><rect x="400" y="352" width="16" height="16"/><rect x="416" y="352" width="16" height="16"/><rect x="432" y="352" width="16" height="16"/><rect x="448" y="352" width="16" height="16"/>
      <rect x="352" y="368" width="16" height="16"/><rect x="368" y="368" width="16" height="16"/><rect x="384" y="368" width="16" height="16"/><rect x="416" y="368" width="16" height="16"/><rect x="432" y="368" width="16" height="16"/><rect x="448" y="368" width="16" height="16"/>
      <rect x="352" y="384" width="16" height="16"/><rect x="368" y="384" width="16" height="16"/><rect x="384" y="384" width="16" height="16"/><rect x="416" y="384" width="16" height="16"/><rect x="432" y="384" width="16" height="16"/><rect x="448" y="384" width="16" height="16"/>
      <rect x="352" y="400" width="16" height="16"/><rect x="368" y="400" width="16" height="16"/><rect x="432" y="400" width="16" height="16"/><rect x="448" y="400" width="16" height="16"/>
    </g>
    <g fill="#131a33">
      <rect x="400" y="368" width="16" height="16"/><rect x="400" y="384" width="16" height="16"/><rect x="384" y="400" width="16" height="16"/><rect x="416" y="400" width="16" height="16"/>
    </g>
    <g fill="#5a3417">
      <rect x="352" y="416" width="16" height="16"/><rect x="368" y="416" width="16" height="16"/><rect x="384" y="416" width="16" height="16"/><rect x="416" y="416" width="16" height="16"/><rect x="432" y="416" width="16" height="16"/><rect x="448" y="416" width="16" height="16"/>
      <rect x="336" y="432" width="16" height="16"/><rect x="352" y="432" width="16" height="16"/><rect x="368" y="432" width="16" height="16"/><rect x="384" y="432" width="16" height="16"/><rect x="416" y="432" width="16" height="16"/><rect x="432" y="432" width="16" height="16"/><rect x="448" y="432" width="16" height="16"/><rect x="464" y="432" width="16" height="16"/>
    </g>
    <g fill="#f1c79b"><rect x="480" y="320" width="16" height="16"/><rect x="304" y="320" width="16" height="16"/></g>
    <g fill="#3a4d8c">
      <rect x="496" y="320" width="16" height="16"/><rect x="496" y="336" width="16" height="16"/><rect x="528" y="320" width="16" height="16"/><rect x="528" y="336" width="16" height="16"/>
    </g>
    <g fill="#f6f3e8"><rect x="512" y="320" width="16" height="16"/><rect x="512" y="336" width="16" height="16"/></g>
    <g fill="#9aa0c0"><rect x="496" y="352" width="16" height="16"/><rect x="512" y="352" width="16" height="16"/><rect x="528" y="352" width="16" height="16"/></g>
    <g fill="#8a5a2b">
      <rect x="288" y="176" width="16" height="16"/><rect x="288" y="192" width="16" height="16"/><rect x="288" y="208" width="16" height="16"/><rect x="288" y="224" width="16" height="16"/><rect x="288" y="240" width="16" height="16"/><rect x="288" y="256" width="16" height="16"/><rect x="288" y="272" width="16" height="16"/><rect x="288" y="288" width="16" height="16"/><rect x="288" y="304" width="16" height="16"/><rect x="288" y="320" width="16" height="16"/><rect x="288" y="336" width="16" height="16"/><rect x="288" y="352" width="16" height="16"/><rect x="288" y="368" width="16" height="16"/><rect x="288" y="384" width="16" height="16"/><rect x="288" y="400" width="16" height="16"/><rect x="288" y="416" width="16" height="16"/>
    </g>
    <g fill="#b07a3e"><rect x="288" y="200" width="16" height="16"/><rect x="288" y="296" width="16" height="16"/></g>
  </g>
  <g class="hero-orb">
    <g fill="#6fd0ff">
      <rect x="272" y="96" width="16" height="16"/><rect x="288" y="96" width="16" height="16"/><rect x="304" y="96" width="16" height="16"/>
      <rect x="256" y="112" width="16" height="16"/><rect x="320" y="112" width="16" height="16"/>
      <rect x="256" y="128" width="16" height="16"/><rect x="320" y="128" width="16" height="16"/>
      <rect x="256" y="144" width="16" height="16"/><rect x="320" y="144" width="16" height="16"/>
      <rect x="272" y="160" width="16" height="16"/><rect x="288" y="160" width="16" height="16"/><rect x="304" y="160" width="16" height="16"/>
    </g>
    <g fill="#1f6fd0">
      <rect x="272" y="112" width="16" height="16"/><rect x="288" y="112" width="16" height="16"/><rect x="304" y="112" width="16" height="16"/>
      <rect x="272" y="128" width="16" height="16"/><rect x="304" y="128" width="16" height="16"/>
      <rect x="272" y="144" width="16" height="16"/><rect x="288" y="144" width="16" height="16"/><rect x="304" y="144" width="16" height="16"/>
    </g>
    <g fill="#ffe08a"><rect x="288" y="128" width="16" height="16"/></g>
    <g fill="#fff3c4">
      <rect x="272" y="120" width="16" height="8"/><rect x="304" y="120" width="16" height="8"/>
      <rect x="276" y="128" width="8" height="8"/><rect x="308" y="128" width="8" height="8"/>
      <rect x="272" y="140" width="16" height="8"/><rect x="304" y="140" width="16" height="8"/>
    </g>
  </g>
</svg>`;
