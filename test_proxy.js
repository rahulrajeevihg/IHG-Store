const ERP_BASE_URL = 'https://erp.ihgind.com';
const upstreamUrl = `${ERP_BASE_URL}/api/method/login`;

const forwardHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
};

const body = Buffer.from('usr=Rahul&pwd=Rahul%40987');

async function test() {
  console.log('Sending request to', upstreamUrl);
  const res = await fetch(upstreamUrl, {
    method: 'POST',
    headers: forwardHeaders,
    body: body
  });
  
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  const text = await res.text();
  console.log('Body:', text);
}

test();
