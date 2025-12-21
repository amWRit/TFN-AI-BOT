import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const combinedPath = path.join(process.cwd(), 'public', 'json', 'combined_data.json');
    const data = await fs.readFile(combinedPath, 'utf8');
    const combined = JSON.parse(data);
    
    let totalDocs = 0;
    const breakdown = {};  // 👈 ADD THIS!
    
    for (const section in combined) {
      if (Array.isArray(combined[section])) {
        const count = combined[section].length;
        breakdown[section] = count;  // 👈 STORE BREAKDOWN!
        totalDocs += count;
      }
    }
    
    return Response.json({ 
      total: totalDocs,
      breakdown,  // 👈 THIS MAKES BREAKDOWN SHOW!
      message: `${totalDocs} documents ready`
    });
  } catch {
    return Response.json({ total: 0, breakdown: {} });
  }
}
