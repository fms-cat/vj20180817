precision highp float;

#define PI 3.141592654
#define TAU 6.283185307

varying vec3 vPos;
varying vec3 vNor;
varying vec2 vUv;

uniform vec3 cameraPos;
uniform float perspFar;
uniform vec3 lightPos;

uniform mat4 matPL;
uniform mat4 matVL;

uniform float time;
uniform vec4 wave;

uniform float colorOffset;
uniform bool isShadow;
uniform float audioReactive;
uniform float chroma;

uniform sampler2D samplerShadow;

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 4.0 ),
    cos( _p + PI / 3.0 * 2.0 )
  );
}

float shadow( float d ) {
  vec4 pl = matPL * matVL * vec4( vPos, 1.0 );
  vec2 uv = pl.xy / pl.w * 0.5 + 0.5;

  float dc = length( vPos - lightPos );
  float ret = 0.0;
  for ( int iy = -1; iy <= 1; iy ++ ) {
    for ( int ix = -1; ix <= 1; ix ++ ) {
      vec2 uv = uv + vec2( float( ix ), float ( iy ) ) * 4E-4;
      float proj = texture2D( samplerShadow, uv ).x;
      proj = proj == 0.0 ? perspFar : proj;
      float bias = 0.1 + ( 1.0 - d ) * 0.3;

      float dif = smoothstep( bias * 2.0, bias, ( dc - proj ) );
      ret += dif / 9.0;
    }
  }
  return ret;
}

void main() {
  if ( isShadow ) {
    float depth = length( vPos - lightPos );
    gl_FragColor = vec4( depth, 0.0, 0.0, 1.0 );
    return;
  }

  vec3 lightDir = normalize( vPos - lightPos );
  float d = dot( -vNor, lightDir );

  float scroll = step( 0.0, sin( vUv.y * 50.0 + abs( vUv.x - 0.5 ) * 30.0 - time * 3.0 ) );
  float reactive = 1.0 + audioReactive * sin( 20.0 * smoothstep( -60.0, -0.0, wave.y ) );
  vec3 accentColor = mix(
    vec3( 0.8 ),
    pow( catColor( TAU * colorOffset ), vec3( 2.0 ) ),
    chroma
  );
  vec3 col = reactive * mix(
    accentColor,
    vec3( 0.04 ),
    scroll
  );

  float shadowFactor = shadow( d );
  col *= mix( 0.1, 1.0, shadowFactor );

  gl_FragColor = vec4( col, 1.0 );
}