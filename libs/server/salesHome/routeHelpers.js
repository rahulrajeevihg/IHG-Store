import { getSalesHomeAll, getSalesHomeSection } from '@/libs/server/salesHome/service';

export function setNoStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

export function enforceGet(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}

function getSalesUserFromReq(req) {
  const queryUser = typeof req.query?.sales_user === 'string' ? req.query.sales_user : '';
  const headerUser = typeof req.headers['x-sales-user'] === 'string' ? req.headers['x-sales-user'] : '';
  return (queryUser || headerUser || '').trim();
}

function getSalesUserNameFromReq(req) {
  const queryName = typeof req.query?.sales_user_name === 'string' ? req.query.sales_user_name : '';
  const headerName = typeof req.headers['x-sales-user-name'] === 'string' ? req.headers['x-sales-user-name'] : '';
  return (queryName || headerName || '').trim();
}

export async function handleAll(req, res) {
  try {
    const payload = await getSalesHomeAll({
      salesUser: getSalesUserFromReq(req),
      salesUserName: getSalesUserNameFromReq(req),
    });
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: 'Failed to load sales home dashboard from ERPNext.',
      details: error?.message || 'Unknown ERP error',
    });
  }
}

export async function handleSection(req, res, section) {
  try {
    const payload = await getSalesHomeSection(section, {
      salesUser: getSalesUserFromReq(req),
      salesUserName: getSalesUserNameFromReq(req),
    });
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: `Failed to load sales home section: ${section}`,
      details: error?.message || 'Unknown ERP error',
    });
  }
}
