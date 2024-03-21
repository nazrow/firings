import matplotlib.pyplot as plt


class Body:
    def __init__(self,
                 mass: int,
                    # в граммах
                 diameter: int,
                    # в миллиметрах
                 height: int,
                    # в миллиметрах
                 surface_complexity: float,
                    # 2.5 для конуса,
                    # 3.1 для сферы,
                    # 3.1 для открытого цилиндра,
                    # 3.9 для цилиндра с дном,
                    # 4...6 для сложных форм
                 thickness: float,
                    # в миллиметрах
                 is_closed: bool = False,
                    # замкнутый объем, воздух подходит только с одной стороны
                 is_target: bool = False,
                    # это обжигаемый товар
                 is_glazed: bool = False,
                    # покрыто нерасплавленной глазурью
                 is_lustered: bool = False
                    # покрыто люстровой краской
        ):
        self.mass = mass / 1000
        self.thickness = thickness / 1000
        self.diameter = diameter / 1000
        self.height = height / 1000
        self.surface_complexity = surface_complexity
        self.is_closed = is_closed
        self.surface_area = self.diameter * self.height * self.surface_complexity * (1 + int(self.is_closed))
        self.is_target = is_target
        self.is_glazed = is_glazed
        self.is_lustered = is_lustered
        self.inertia = (self.thickness ** 2 * self.mass ** 2 / self.surface_area) ** 0.5
    def __str__(self):
        return f'Body: {self.mass*1000:.0f} g, {self.thickness*1000:.1f} mm thick, {self.surface_area*10000:.0f} cm2 surface area, ' \
               f'is likely {self.mass / self.surface_area * (1 + int(self.is_closed)) / self.thickness:.0f} kg/m3 dense, ' \
               f'{"is" if self.is_lustered else "is not"} lustered, {"is" if self.is_glazed else "is not"} glazed, ' \
               f'{"is" if self.is_target else "is not"} the firing target, ' \
               f'inertia is {self.inertia*1000:.1f} g'



bodies = [
    Body(1500, 230, 14, 18, 14, True, False),
        # лещадка
    # Body(70, 40, 60, 3.9, 2.1, False, True),
    # Body(140, 90, 70, 3.6, 1.3, False, True, True),
    # Body(100, 60, 60, 3, 1.8, False, True),
    # Body(1000, 90, 200, 4, 3.2, False, True),
    # Body(90, 50, 35, 5, 17, True, True)
]
for body in bodies:
    print(body)
target = Body(
    sum(body.mass for body in bodies if body.is_target) * 1000,
    1,
    1,
    1,
    sum(body.thickness * body.mass for body in bodies if body.is_target) / sum(body.mass for body in bodies if body.is_target) * 1000,
    False,
    True,
    any(body.is_glazed for body in bodies if body.is_target),
    any(body.is_lustered for body in bodies if body.is_target)
)
target.surface_area = sum(body.surface_area for body in bodies if body.is_target)
target.inertia = (target.thickness ** 2 * target.mass ** 2 / target.surface_area) ** 0.5
print(target)
extra_mass = sum(body.mass for body in bodies if not body.is_target)

temp = [20, 95, 105, 200, 400, 550, 600, 900, 1100, 1240, 1241]
speed = [
    100, # прогрев воды
    30, # кипячение воды
    100, # выгрев остатков воды
    (130 - 50 * int(target.is_lustered)), # выжиг органики, в частности из люстра
    220, # догрев до кварцевого метаморфоза
    40, # кварцевый метаморфоз
    220, # разложение глин с выходом газов и химически связанной воды
    200, # подъем до жидкой фазы
    (200 - 100 * int(target.is_glazed)), # окончательный обжиг, плавление глазури при наличии
    3 # выдержка
]
speed = [value * (1 - .03 * target.inertia) * (1 - .15 * extra_mass) for value in speed]
t = 0
mode = [(t, temp[0])]

for i in range(len(temp)-1):
    print(f'SP{i+1}: {temp[i]}°C')
    dt = abs(temp[i+1]-temp[i])/speed[i]*60
    t += dt
    print(f'T{i+1}: {dt:.0f} min (@ {speed[i]:.1f})')
    mode.append((t, temp[i+1]))
print(f'SP{len(temp)}: {temp[-1]}°C')
print(f'T{len(temp)}: -121')
# plt.plot([step[0]/60 for step in mode], [step[1] for step in mode])
# plt.show()
