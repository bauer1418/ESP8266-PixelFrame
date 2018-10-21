

class LoginService {

    setLoggedIn = (loggedIn) => {
        this.loggedIn = loggedIn;
    }

    isLoggedIn = () => {
        return this.loggedIn;
    }


}



export default new LoginService()



