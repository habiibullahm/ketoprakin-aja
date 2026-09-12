import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { menuItems } from "@/data/mock"
import type { MenuItem } from "@/types"

export function StockManagement() {
  const [items, setItems] = useState<MenuItem[]>(menuItems)

  const toggleAvailability = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Stok</h1>
          <p className="text-muted-foreground">Toggle ketersediaan bahan/menu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={!item.available ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant={item.available ? "default" : "secondary"}>
                        {item.available ? "Tersedia" : "Habis"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-sm font-medium text-primary mt-2">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Button
                    variant={item.available ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleAvailability(item.id)}
                  >
                    {item.available ? "Matikan" : "Nyalakan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
