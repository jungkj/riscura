import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ size: string[] }>;
}

// Generate placeholder image
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Await the params to get the actual values
    const resolvedParams = await params;
    const { size } = resolvedParams;
    
    // Default dimensions
    let width = 400;
    let height = 300;
    
    if (size && size.length > 0) {
      const dimensions = size[0].split('x');
      if (dimensions.length === 2) {
        width = parseInt(dimensions[0]) || 400;
        height = parseInt(dimensions[1]) || 300;
      } else {
        // Single number means square
        const dim = parseInt(size[0]) || 400;
        width = dim;
        height = dim;
      }
    }
    
    console.log(`Generating placeholder image: ${width}x${height}`);
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f1e9"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif" font-size="18" fill="#191919">
          ${width}×${height}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    
    // Fallback SVG
    const fallbackSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f1e9"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif" font-size="18" fill="#191919">
          400×300
        </text>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }
} 