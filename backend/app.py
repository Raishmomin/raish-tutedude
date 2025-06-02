from flask import Flask, request

app = Flask(__name__)
@app.route('/')
def index():
    return '''
       <h1>Welcome to Flask!</h1>
    '''

@app.route('/submit', methods=['POST'])
def submit():
    # name = request.form['name']
    # email = request.form['email']
    # print(f"Received: {name}, {email}")
    return 'Data received by Flask!', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
