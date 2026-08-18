import React from 'react';
import { Redirect } from 'expo-router';

export default function LeadsScreen() {
  return <Redirect href="/(comercial)/clients?segment=LEAD" />;
}
