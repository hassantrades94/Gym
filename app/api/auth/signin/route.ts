import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!)

export async function POST(request: NextRequest) {
  console.log("Sign in API route called")
  
  try {
    // Validate environment variables first
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

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
    const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`
    console.log("Normalized phone:", normalizedPhone)

    console.log("Querying user from database...")
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .maybeSingle()

    console.log("Database query result:", { 
      user: user ? "found" : "not found", 
      error: error?.message || null,
      userType: user?.user_type 
    })

    if (error) {
      console.log("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!user) {
      console.log("User not found")
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

    // Get gym info separately to avoid complex joins
    let gymInfo = null
    
    if (user.user_type === "member") {
      const { data: membership } = await supabase
        .from("memberships")
        .select(`
          gym_id,
          gyms (
            id,
            gym_name
          )
        `)
        .eq("user_id", user.id)
        .single()
      
      if (membership?.gyms) {
        const gym = Array.isArray(membership.gyms) ? membership.gyms[0] : membership.gyms
        gymInfo = {
          gym_id: gym.id,
          gym_name: gym.gym_name,
        }
      }
    } else if (user.user_type === "gym_owner") {
      const { data: gym } = await supabase
        .from("gyms")
        .select("id, gym_name")
        .eq("owner_id", user.id)
        .single()
      
      if (gym) {
        gymInfo = {
          gym_id: gym.id,
          gym_name: gym.gym_name,
        }
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