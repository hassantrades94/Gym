import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("Sign in API route called")
  
  try {
    const body = await request.json()
    console.log("Request body:", { ...body, password: "[REDACTED]" })
    
    const { phone, password, userType } = body
    
    if (!phone || !password || !userType) {
      console.log("Missing required fields:", { phone: !!phone, password: !!password, userType: !!userType })
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      )
    }

    // Normalize phone number format
    const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`
    console.log("Normalized phone:", normalizedPhone)

    console.log("Querying user from database...")
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        phone_number,
        password_hash,
        full_name,
        user_type,
        memberships (
          gym_id,
          gyms (
            id,
            gym_name
          )
        ),
        gyms (
          id,
          gym_name
        )
      `)
      .eq("phone_number", normalizedPhone)
      .single()

    console.log("Database query result:", { user: user ? "found" : "not found", error })

    if (error || !user) {
      console.log("User not found or database error:", error)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Verifying password...")
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    console.log("Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Checking user type:", { userType, dbUserType: user.user_type })
    if (user.user_type !== userType) {
      const correctDashboard = user.user_type === "member" ? "Member" : "Gym Owner"
      return NextResponse.json(
        {
          error: "Access Denied",
          message: `You are registered as a ${correctDashboard}. Please select the correct login type.`,
        },
        { status: 403 },
      )
    }

    let gymInfo = null
    if (user.user_type === "member" && user.memberships?.[0]?.gyms) {
      const membership = user.memberships?.[0]
      const gymsRelation = membership?.gyms as any
      const gymObj = Array.isArray(gymsRelation) ? gymsRelation[0] : gymsRelation
      gymInfo = {
        gym_id: gymObj?.id,
        gym_name: gymObj?.gym_name,
      }
    } else if (user.user_type === "gym_owner" && user.gyms?.[0]) {
      gymInfo = {
        gym_id: user.gyms[0].id,
        gym_name: user.gyms[0].gym_name,
      }
    }

    const userData = {
      id: user.id,
      phone_number: user.phone_number,
      full_name: user.full_name,
      user_type: user.user_type,
      ...gymInfo,
    }

    const isDefaultPassword = password === "123456"

    console.log("Sign in successful for user:", user.id)
    return NextResponse.json({
      success: true,
      user: userData,
      isDefaultPassword,
    })
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}