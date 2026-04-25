import React, { useState, useEffect, useMemo, useRef } from 'react';
import SearchCom from '@/components/Search/SearchCom'
import { useRouter } from 'next/router'

export default function index({ }) {

  const router = useRouter();

  return (
    <>
      <SearchCom />
    </>  
  )

}



