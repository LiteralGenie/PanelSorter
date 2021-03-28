"""
Displays image from socket.
"""

from flask import Flask, render_template, request
from flask_socketio import SocketIO
import utils


# init app + socket
class DynamicPage:
	def __init__(self):
		self.app= Flask(__name__, template_folder=utils.STATIC_DIR + "/dynamic_page/")
		self.socket= SocketIO(self.app)
		self.state= PageState()

		self.app.add_url_rule('/', 'home', self.home)
		self.app.add_url_rule('/update/', 'update', self.update, methods=['POST'])

	def home(self):
		if self.state.mode == PageState.TEXT_MODE:
			return render_template("template.html", text=self.state.text)
		else:
			return render_template("template.html", image=self.get_image())

	def update(self):
		self.state.mode= PageState.IMAGE_MODE

		if not self.state.threaded:
			image= request.form['image']
			self.state.image= image
		else:
			# already updated by another thread
			image= self.state.image.value

		with self.app.app_context():
			self.socket.emit('update', image, broadcast=True)
		return ""

	def get_image(self):
		if self.state.image.__class__ is str:
			return self.state.image
		else:
			return self.state.image.value

	@staticmethod
	def start(shared_image=None):
		page= DynamicPage()
		if shared_image:
			page.state.image= shared_image
			page.state.threaded= True
		page.socket.run(page.app)

class PageState:
	TEXT_MODE= 0
	IMAGE_MODE= 1
	link= "http://localhost:5000/"

	def __init__(self, threaded=False):
		self.mode= self.TEXT_MODE
		self.text= "I don't feel so good..."
		self.image= None # base64 image
		self.threaded= threaded
