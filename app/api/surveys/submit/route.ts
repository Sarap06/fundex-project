import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, countryCode, phoneNumber, secondCountryCode, secondPhoneNumber } = await request.json();

    if (!fullName || !email || !countryCode || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { data: existingSurvey } = await supabase
      .from('investor_surveys')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSurvey) {
      const { error: updateError } = await supabase
        .from('investor_surveys')
        .update({
          full_name: fullName,
          email,
          country_code: countryCode,
          phone_number: phoneNumber,
          second_country_code: secondCountryCode || null,
          second_phone_number: secondPhoneNumber || null,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Survey updated successfully',
      });
    }

    const { error: insertError } = await supabase
      .from('investor_surveys')
      .insert({
        user_id: user.id,
        company_id: userProfile.company_id,
        full_name: fullName,
        email,
        country_code: countryCode,
        phone_number: phoneNumber,
        second_country_code: secondCountryCode || null,
        second_phone_number: secondPhoneNumber || null,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully',
    });
  } catch (error: Error | unknown) {
    console.error('Survey submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
