"use client"

import Link from "next/link"
import { useAuth } from "../hooks/useAuth"

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">\

