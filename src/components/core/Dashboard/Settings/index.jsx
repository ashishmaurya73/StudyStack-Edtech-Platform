import UpdatePassword from "./UpdatePassword"
import DeleteAccount from "./DeleteAccount"
import ChangeProfilePicture from "./ChangeProfilePicture"
import EditProfile from "./EditProfile"


const index = () => {
  return (
    <div>
      <h1 className="mb-14 text-3xl font-medium text-richblack-5">
        Edit Profile
      </h1>

      {/* Change profile picture */}
      <ChangeProfilePicture/>

      {/* Profile */}
      <EditProfile/>

      {/* Password */}
      <UpdatePassword/>

      {/* Delete Account */}
      <DeleteAccount/>
    </div>
  )
}

export default index
