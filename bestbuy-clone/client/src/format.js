const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const money = (cents) => usd.format((cents || 0) / 100);

export const date = (iso) =>
  new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
