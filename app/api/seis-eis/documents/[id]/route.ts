import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document and verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select(`
        *,
        companies!inner(founder_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user owns the company
    if (document.companies.founder_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract filename from URL for storage deletion
    const urlParts = document.file_url.split('/');
    const filename = urlParts.slice(-3).join('/'); // company_id/document_type/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('seis-eis-documents')
      .remove([filename]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
