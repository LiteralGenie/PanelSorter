"""
Convert pages into training data for panel ordering. (Answer key is generated but inaccurate!)
"""

import glob, os, utils, re
from utils.panel_seg_utils import segment_panels


src_dir= r"C:\Programming\KR_Textify\data\chaps/"
out_dir= utils.DS_ORIG_DIR + "knight_run/"

# setting sort to true sorts the chapters by number instead of alphabetically
def iter_pages(sort=False):
	chap_lst= list(glob.glob(src_dir + "*"))

	if sort:
		rgx= re.compile(r"(\d+(?:\.\d+)?)") # eg 1.3 or 145
		def sort_func(x):
			x= os.path.basename(x)
			num= rgx.search(x)
			if num:
				return float(num.groups()[0])
			else:
				return -1
		chap_lst.sort(key=sort_func)

	for chap in chap_lst: # /123/
		chap_num= os.path.basename(chap)
		assert float(chap_num)

		page_lst= list(glob.glob(chap + "/naver/*.png"))
		for page in page_lst: # /123/naver/01.png":
			page_num= os.path.basename(page)
			page_num= page_num.split(".")[0]
			assert float(page_num)

			yield dict(
				chap_num= chap_num,
				page_num= page_num,
				im_path= page,

				num_chaps= len(chap_lst),
				num_pages= len(page_lst),
			)


ts= utils.Timestamp()
for x in iter_pages(sort=True):
	ts.log(f'Scanning [Chapter {x["chap_num"]} / {x["num_chaps"]}] - [Page {x["page_num"]} / {x["num_pages"]}] ...')

	# skip if already scanned
	out_path= out_dir + f"{x['chap_num'].zfill(3)}-{x['page_num'].zfill(3)}.json"
	# if os.path.exists(out_path):
	# 	continue

	# convert contours (ndarray to list) and remove unnecessary dimension
	# (opencv returns a list of points, but each point looks like [[x,y]])
	res= segment_panels(x['im_path'])
	contours= [[y[0] for y in x.tolist()] for x in res['contours']]
	contours= list(reversed(contours)) # bottom-most contours are usually first by default
	image= res['image']

	# skip if no contours
	if not contours:
		continue

	# dump data
	data= dict(
		dimensions= list(image.shape),
		other= dict(
			source= dict(
				series= 'knight_run',
				chap_num= x['chap_num'],
				page_num= x['page_num'],
			),
			notes= ""
		),
		order= [str(i) for i in range(len(contours))],
		contours= { str(i) : contours[i] for i in range(len(contours)) },
	)

	utils.dump_json(data, out_path)