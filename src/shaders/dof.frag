// Ref: https://www.shadertoy.com/view/4d2Xzw

#define saturate(i) clamp(i,0.,1.)

#define BOKEH_ITER 100
#define BOKEH_ANGLE 2.39996
#define BOKEH_RADIUS_MAX (resolution.x / 64.0)

precision highp float;

uniform vec4 bgColor;
uniform vec2 resolution;
uniform sampler2D samplerColor;
uniform sampler2D samplerDepth;

uniform float bokehAmp;
uniform float bokehFocus;
uniform float fogAmp;

float linearstep( float a, float b, float x ) {
  return clamp( ( x - a ) / ( b - a ), 0.0, 1.0 );
}

mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float radiusPerStep = BOKEH_RADIUS_MAX / float( BOKEH_ITER );
  float radius = radiusPerStep * 1E-5; // EPSILON
  vec2 nOffset = vec2( 0.0, 1.0 );
  mat2 rotator = rotate2D( BOKEH_ANGLE );
  
  vec4 sum = vec4( 0.01 );

  for ( int i = 0; i < BOKEH_ITER; i ++ ) {
    vec2 uv = ( gl_FragCoord.xy + nOffset * radius ) / resolution;
    vec3 col = texture2D( samplerColor, uv ).xyz;
    float len = texture2D( samplerDepth, uv ).x;
    col = mix( bgColor.xyz, col, exp( -fogAmp * len ) );

    float r = min( abs( 1.0 / len - 1.0 / bokehFocus ) * 100.0 * bokehAmp, BOKEH_RADIUS_MAX );
    float dif = 1.0 / floor( 1.0 + r / BOKEH_RADIUS_MAX * float( BOKEH_ITER ) );
    if ( radius < r ) {
      sum += saturate( dif ) * vec4( col, 1.0 );
    }

    nOffset = rotator * nOffset;
    radius += radiusPerStep;
  }

  gl_FragColor = vec4( sum.xyz / sum.w, 1.0 );
}
