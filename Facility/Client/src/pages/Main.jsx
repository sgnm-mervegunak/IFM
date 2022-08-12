import React from 'react';
import { useAppSelector } from '../app/hook';

export default function Main() {

  const {toast} = useAppSelector(state => state.toast);
  
  return <div><button onClick={()=>{
    toast.current.show({life: 5000, severity: 'error', summary: 'Error Message', detail: 'Validation failed'});
  }}>click</button></div>;
}
