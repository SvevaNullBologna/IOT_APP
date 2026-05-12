import re
import socket
import struct
import time

MULTICAST_GROUP = '232.1.1.1'
PORT = 1235

BATCH_TIMEOUT = 23.0

class AtlasBridge:
    def __init__(self):
        self.curr_atlas_things = {}
        self.atlas_status = False
        self.atlas_socket = None

    def connect(self):
        # let's find the local ip first
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
        except Exception:
            local_ip = '127.0.0.1'
            self.atlas_status = False
        finally:
            s.close()

        # let's open a socket to listen to atlas
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((local_ip, PORT))

        group = socket.inet_aton(MULTICAST_GROUP)
        mreq = struct.pack('4s4s', group, socket.inet_aton(local_ip))
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

        sock.settimeout(BATCH_TIMEOUT)  # to figure out when Atlas stops sending tweets

        print(f"Atlas discovery su {local_ip}....\n")
        self.atlas_status = True
        self.atlas_socket = sock

        while True:
            try:
                data, addr = self.atlas_socket.recvfrom(65535)
                raw_tweet = data.decode(errors='ignore')
                self.on_tweet(raw_tweet)

            except socket.timeout:
                print("Socket timed out")
        #we detect silence from atlas
        #when it restarts, we restart updating



    def on_tweet(self, tweet):
        parsed_tweet = self.raw_parse_tweet(tweet)


        t_type = parsed_tweet.get("Tweet Type")
        thing_id = parsed_tweet.get("Thing ID")

        if not t_type or not thing_id:
            return

        # -------------------------------
        #           IDENTITY
        # -------------------------------

        if t_type == "Identity_Thing":

            if thing_id not in self.curr_atlas_things:

                new_thing = AtlasThing(parsed_tweet)

                self.curr_atlas_things[thing_id] = new_thing

            else :
                self.curr_atlas_things[thing_id].last_seen = time.time()


        # -------------------------------
        #           SERVICE
        # -------------------------------

        elif t_type == "Service":
            if thing_id in self.curr_atlas_things :
                self.curr_atlas_things[thing_id].add_service(parsed_tweet)




    def disconnect(self):
        self.atlas_status = False

    def raw_parse_tweet(self, raw_tweet: str):
        # let's extract the block first
        block = None
        start = raw_tweet.rfind('{')
        end = raw_tweet.rfind('}')
        if not (start == -1 or end == -1):
            block = raw_tweet[start:end + 1]

        # let's get the key and value now
        pattern = r'"([^"]+)"\s*:\s*"([^"]*)"'

        matches = re.findall(pattern, block)

        result = {}
        for key, value in matches:
            result[key] = value

        return result if result else None

class AtlasService:
    def __init__(self, tweet):
        self.thing_id = tweet.get("Thing ID", "Unknown")
        self.service_name = tweet.get("Name", "Unknown")
        self.service_id = tweet.get("ID", "Unknown")
        self.API = tweet.get("API", "Unknown")
        self.type = tweet.get("Type","Unknown") # actuator vs sensor
        self.owner = tweet.get("Owner", "Unknown")
        self.vendor = tweet.get("Vendor", "Unknown")
        self.status = True
        self.last_seen = time.time()

    def update_last_seen(self):
        self.last_seen = time.time()


class AtlasThing:
    def __init__(self, tweet):
        self.hardware_id = tweet.get("Thing ID", "Unknown")
        self.virtual_space_name = tweet.get("Space ID", "Unknown")
        self.status = True
        self.last_seen = time.time()
        self.atlas_services = {}


    def add_service(self, tweet):
        service = AtlasService(tweet)

        if service.service_id not in self.atlas_services:
            self.atlas_services[service.service_id] = service

            print(f"\nadded service: {service.service_id}")

    def set_services_status(self, status: bool):
        for service in self.atlas_services.values():
            service.status = status

    def update_last_seen(self):
        self.last_seen = time.time()

    def __repr__(self):
        return f"<Thing {self.hardware_id}>"





if __name__ == "__main__":
    atlas_bridge = AtlasBridge()
    atlas_bridge.connect()
