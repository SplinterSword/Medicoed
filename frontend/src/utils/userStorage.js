export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user")
    if (!rawUser) {
      return null
    }
    return JSON.parse(rawUser)
  } catch (error) {
    return null
  }
}

export const isValidStoredUser = (user) => {
  if (!user || typeof user !== "object") {
    return false
  }

  const requiredStringFields = ["id", "email", "partner_user_id", "subscription_status", "fullName"]
  const hasRequiredStrings = requiredStringFields.every(
    (field) => typeof user[field] === "string" && user[field].trim().length > 0
  )

  return hasRequiredStrings && typeof user.isSubscribed === "boolean"
}
