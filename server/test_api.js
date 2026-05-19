async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/reviews/latest');
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}
test();
