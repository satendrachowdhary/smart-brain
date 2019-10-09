import React from "react";
import "./App.css";
import Clarifai from "clarifai";
import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import Register from "./components/Register/Register";
import Rank from "./components/Rank/Rank";
import Signin from "./components/Signin/Signin";
import Particles from "react-particles-js";

const app = new Clarifai.App({
  apiKey: "afdba86d211e488b9775e5df5afdd784"
});

const particlesOption = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
};

const initialState = {
  input: "",
  imageURL: "",
  box: {},
  route: "signin",
  isSignedIn: false,
  user: {
    id: "",
    name: "",
    email: "",
    entries: 0,
    joined: ""
  }
};

class App extends React.Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = data => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    });
  };

  calculateFaceLocation = data => {
    const clarifaiFace =
      data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById("inputImage");
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height
    };
  };

  displayFaceBox = box => {
    this.setState({ box: box });
  };

  onInputChange = event => {
    this.setState({ input: event.target.value });
  };

  onButtonSubmit = () => {
    this.setState({ imageURL: this.state.input }, () => {
      app.models
        .predict(Clarifai.FACE_DETECT_MODEL, this.state.imageURL)
        .then(response => {
          if (response) {
            fetch("http://localhost:3000/image", {
              method: "put",
              headers: { "Content-Type": "Application/json" },
              body: JSON.stringify({ id: this.state.user.id })
            })
              .then(response => response.json())
              .then(count => {
                this.setState(
                  Object.assign(this.state.user, { entries: count })
                );
              })
              .catch(console.log);
          }
          this.displayFaceBox(this.calculateFaceLocation(response));
        })
        .catch(err => console.log(err));
    });
  };

  onRouteChange = route => {
    if (route === "home") {
      this.setState({ isSignedIn: true });
    } else if (route === "signout") {
      this.setState(initialState);
    }
    this.setState({ route: route });
  };

  render() {
    const { isSignedIn, imageURL, box } = this.state;

    return (
      <div className="App">
        <Particles className="particles" params={particlesOption} />
        <Navigation
          onRouteChange={this.onRouteChange}
          isSignedIn={isSignedIn}
        />
        {this.state.route === "signin" || this.state.route === "signout" ? (
          <Signin onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
        ) : this.state.route === "register" ? (
          <Register
            onRouteChange={this.onRouteChange}
            loadUser={this.loadUser}
          />
        ) : (
          <div>
            <Logo />
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageURL={imageURL} />
          </div>
        )}
      </div>
    );
  }
}

export default App;