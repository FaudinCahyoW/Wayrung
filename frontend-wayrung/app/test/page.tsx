"use client"

import { useEffect, useState } from "react"

export default function TestPage(){
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        .then((res) => res.json())
        .then((json) => {
            console.log("Response dari Go:", json)
            setData(json)
        })
        .catch((err) => {
            console.error("Gagal fetch:", err)
            setError(err.message)
        })
    },[])

    return (
        <div style={{padding:20}}>
            <h1>Test koneksi ke Backend Wayrung</h1>
            {error && <p style={{color: "red"}}>Error: {error}</p>}
            {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : !error && <p>Loading...</p>}
        </div>
    )
    
}