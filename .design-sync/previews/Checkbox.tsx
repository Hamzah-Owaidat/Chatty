import React, { useState } from 'react';
import { Checkbox } from 'chatty';

export function Unchecked() {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onChange={setChecked} label="Email me updates" />;
}

export function Checked() {
  const [checked, setChecked] = useState(true);
  return <Checkbox checked={checked} onChange={setChecked} label="Remember this device" />;
}

export function Disabled() {
  return <Checkbox checked={false} onChange={() => {}} disabled label="Unavailable" />;
}
