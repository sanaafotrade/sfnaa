import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLang = 'ar' } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    // We can use Google Translate's free undocumented API for simple HTML/text translation
    // Note: for production with heavy usage, consider using the official Cloud Translation API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // data[0] contains the translated segments
    const translatedText = data[0].map((item: any) => item[0]).join('');

    return NextResponse.json({ translatedText });
  } catch (error) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
