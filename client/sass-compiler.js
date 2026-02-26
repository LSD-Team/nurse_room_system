import sass from 'sass';

/**
 * Custom Sass compiler function for Vite using the modern Sass API
 */
export function compileScss(source, filename) {
  try {
    const result = sass.compileString(source, {
      loadPaths: ['.', './node_modules'],
      sourceMap: true,
      sourceMapIncludeSources: true,
      style: 'expanded',
      url: new URL(`file://${filename}`)
    });
    
    return {
      code: result.css,
      map: result.sourceMap
    };
  } catch (error) {
    console.error('Sass compilation error:', error);
    return { code: '', map: '' };
  }
}
