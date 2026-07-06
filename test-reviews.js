import { supabase } from './src/services/supabaseClient'

async function testQuery() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      reviews(id)
    `)
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', JSON.stringify(data, null, 2))
  }
}

testQuery()
